import getPitchshiftNode from './pitchshift';

/**
 * Audio Engine for playing audio files based on the Web Audio API.
 *
 * BUFFER TIME vs PLAYBACK TIME
 *
 * Buffer Time: Position in the original audio file (seconds of audio data consumed).
 * Playback Time: Time experienced by the user (real-world elapsed seconds).
 *
 * Relationship: `bufferTime = playbackTime × playbackRate`
 *
 * Examples:
 * - At playbackRate 1.0 (normal speed):
 *   10 seconds playback time = 10 seconds buffer time
 *
 * - At playbackRate 2.0 (double speed):
 *   10 seconds playback time = 20 seconds buffer time
 *   (Playing twice as fast, so we consume 20 seconds of audio in 10 real seconds)
 *
 * - At playbackRate 0.5 (half speed):
 *   10 seconds playback time = 5 seconds buffer time
 *   (Playing half as fast, so we only consume 5 seconds of audio in 10 real seconds)
 */
class AudioEngine {
	// ----- Web Audio -----
	private ctx: AudioContext;
	private sourceNode: AudioBufferSourceNode | null = null;
	private gainNode: GainNode;
	private pitchshiftNode: Awaited<ReturnType<typeof getPitchshiftNode>> | null = null;

	// ----- Audio state -----
	/** Currently loaded audio file. */
	private audioBlob = $state<Blob | null>(null);
	/** AudioBuffer for the currently loaded audio file. */
	private buffer = $state<AudioBuffer | null>(null);

	// ----- Clock state -----
	private now = $state(0);
	private rafID: number | undefined;

	// ----- Playback state -----
	private isPlaying = $state(false);
	/** Time in seconds when playback started (Playback Time). */
	private startTime = $state(0);
	/** Time in seconds where to start playback (Playback Time). */
	private offset = $state(0);

	// ----- Controls state -----
	/** Playback speed. */
	private playbackRate = $state(1);
	/** Volume (number between 0 and 2. Default 1). */
	volume = $state(1);

	// ----- Other -----
	/** Wether to ignore the AudioBufferSourceNode `ended` event (used when seeking). */
	private suppressEnded = false;

	// ---- Derived values -----
	/** Duration in seconds of the original audio (Buffer Time). */
	bufferDuration = $derived(this.buffer ? this.buffer.duration : 0);
	/** Duration in seconds of the processed audio (Playback Time). */
	duration = $derived(this.bufferDuration / this.playbackRate);
	/** Current position in seconds (Buffer Time). */
	bufferPosition = $derived.by(() => {
		const bufferOffset = this.offset * this.playbackRate;
		if (this.isPlaying) {
			const elapsed = (this.now - this.startTime) * this.playbackRate;
			return Math.min(bufferOffset + elapsed, this.bufferDuration);
		}
		return bufferOffset;
	});
	/** Current position in seconds (Playback Time). */
	playbackPosition = $derived.by(() => this.bufferPosition / this.playbackRate);

	constructor() {
		this.ctx = new AudioContext();
		this.gainNode = this.ctx.createGain();
		getPitchshiftNode(this.ctx).then((node) => {
			this.pitchshiftNode = node;
		});

		$effect.root(() => {
			$effect(() => {
				this.gainNode.gain.value = this.volume;
			});

			return () => {
				console.warn('Root effect cleanup');
			};
		});
	}

	get blob() {
		return this.audioBlob;
	}

	clearAudio(): void {
		this.stop();
		this.audioBlob = null;
		this.buffer = null;
	}

	async loadAudio(blob: Blob): Promise<void> {
		this.audioBlob = blob;
		const arrayBuffer = await blob.arrayBuffer();
		this.buffer = await this.ctx.decodeAudioData(arrayBuffer);
		this.stop();
	}

	private startClock(): void {
		const loop = () => {
			this.now = this.ctx.currentTime;
			this.rafID = requestAnimationFrame(loop);
		};
		this.rafID = requestAnimationFrame(loop);
	}
	private stopClock(): void {
		cancelAnimationFrame(this.rafID!);
	}

	private createSource(): AudioBufferSourceNode | null {
		if (!this.buffer || !this.pitchshiftNode) return null;
		const source = this.ctx.createBufferSource();
		source.buffer = this.buffer;
		source.playbackRate.value = this.playbackRate;
		source.connect(this.pitchshiftNode).connect(this.gainNode).connect(this.ctx.destination);
		source.onended = () => {
			if (this.isPlaying && !this.suppressEnded) {
				this.pause(); // Pause at the end of the buffer instead of stopping
			}
			this.suppressEnded = false;
		};
		return source;
	}

	get playing() {
		return this.isPlaying;
	}

	togglePlay(): void {
		if (this.isPlaying) this.pause();
		else this.play();
	}

	play(): void {
		if (this.isPlaying || !this.buffer) return;

		// Resume context if suspended (browser policy)
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}

		this.sourceNode = this.createSource();
		if (!this.sourceNode) return;

		this.startTime = this.ctx.currentTime;
		this.sourceNode.start(0, this.offset * this.playbackRate);

		this.isPlaying = true;
		this.startClock();
	}

	pause(): void {
		if (!this.isPlaying) return;

		this.offset = this.playbackPosition;
		this.sourceNode?.stop();

		this.sourceNode = null;
		this.isPlaying = false;
	}

	stop(): void {
		this.sourceNode?.stop();
		this.sourceNode = null;

		this.offset = 0;
		this.isPlaying = false;
		this.stopClock();
	}

	seekTo(time: number): void {
		if (!this.buffer) return;
		const wasPlaying = this.isPlaying;

		if (wasPlaying) {
			this.suppressEnded = true;
			this.stop();
		}

		// Clamp target time
		const clamped = Math.max(0, Math.min(time, this.duration));
		this.offset = clamped;

		// If currently playing, restart source at new offset
		if (wasPlaying) {
			this.play();
		}
	}

	seekBy(delta: number): void {
		this.seekTo(this.playbackPosition + delta);
	}

	get playbackSpeed() {
		return this.playbackRate;
	}
	setPlaybackSpeed(newRate: number): void {
		const wasPlaying = this.isPlaying;

		// Keep track of original position in buffer time, before playbackRate is updated.
		const bufferPosition = this.bufferPosition;

		if (wasPlaying) {
			this.suppressEnded = true;
			this.stop();
		}

		// Set new playbackRate and start source at new offset
		this.playbackRate = newRate;
		this.offset = bufferPosition / newRate;
		if (wasPlaying) this.play();

		// Counteract pitch distortion that comes from setting the sourceNode playbackRate.
		this.pitchshiftNode?.setPitch(1 / newRate);
	}

	volumeUp() {
		this.volume = Math.min(2, this.volume + 0.1);
	}
	volumeDown() {
		this.volume = Math.max(0, this.volume - 0.1);
	}
	volumeMute() {
		if (this.volume > 0) this.volume = 0;
		else this.volume = 1;
	}
}
const audioEngine = new AudioEngine();
export default audioEngine;
