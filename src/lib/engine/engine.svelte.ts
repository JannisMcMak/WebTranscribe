import Parameter from './parameter';
import getPitchshiftNode from './pitchshift';

export const playbackRateParam = new Parameter({ defaultValue: 1, min: 0.2, max: 1.5, step: 0.1 });
export const volumeParam = new Parameter({ defaultValue: 1, min: 0, max: 2, step: 0.1 });

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

	private analyzer: AnalyserNode;
	private analyzerData: Float32Array;

	// ----- Audio state -----
	/** Currently loaded audio file. */
	private audioBlob = $state<Blob | null>(null);
	/** AudioBuffer for the currently loaded audio file. */
	private buffer = $state<AudioBuffer | null>(null);

	// ----- Clock state -----
	private now = $state(0);
	private rafID: number | undefined;

	// ----- Controls state -----
	/** Playback speed. */
	private playbackRate = $state(1);
	/** Volume (number between 0 and 2. Default 1). */
	volume = $state(1);
	/**
	 * Flag controlling wether the audio should loop at the given loop points.
	 * This is always false if no loop is set.
	 */
	enableLooping = $state(false);

	// ----- Playback state -----
	private isPlaying = $state(false);
	/** Time in seconds when playback started (Playback Time). */
	private startTime = $state(0);
	/** Time in seconds where to start playback (Playback Time). */
	private offset = $state(0);
	/** Loop start and end in seconds (Plaback Time). */
	private loopMarkers: { start: number; end: number } | null = $state(null);

	// ----- Other -----
	/** Wether the audio is currently loading. */
	isLoading = $state(false);

	/** Wether to ignore the next {@link AudioBufferSourceNode.onended} event. */
	private suppressEnded = false;

	// ---- Derived values -----
	/** Duration in seconds of the original audio (Buffer Time). */
	readonly bufferDuration = $derived(this.buffer ? this.buffer.duration : 0);
	/** Duration in seconds of the processed audio (Playback Time). */
	readonly duration = $derived(this.bufferDuration / this.playbackRate);
	/** Current position in seconds (Buffer Time). */
	readonly bufferPosition = $derived.by(() => {
		const bufferOffset = this.offset * this.playbackRate;
		if (!this.isPlaying) return bufferOffset;

		const elapsed = (this.now - this.startTime) * this.playbackRate;
		let pos = bufferOffset + elapsed;

		// Account for looping
		if (this.enableLooping && this.loopMarkers) {
			const loopLength = this.loopMarkers.end - this.loopMarkers.start;
			if (loopLength > 0 && pos >= this.loopMarkers.start) {
				pos = this.loopMarkers.start + ((pos - this.loopMarkers.start) % loopLength);
			}
		}

		return Math.min(pos, this.bufferDuration);
	});
	/** Current position in seconds (Playback Time). */
	readonly playbackPosition = $derived.by(() => this.bufferPosition / this.playbackRate);

	constructor() {
		this.ctx = new AudioContext();
		this.gainNode = this.ctx.createGain();
		getPitchshiftNode(this.ctx).then((node) => {
			this.pitchshiftNode = node;
		});

		this.analyzer = this.ctx.createAnalyser();
		this.analyzer.fftSize = 2048;
		this.analyzerData = new Float32Array(this.analyzer.fftSize);

		$effect.root(() => {
			$effect(() => {
				this.gainNode.gain.value = this.volume;
			});

			return () => {
				console.warn('Root effect cleanup');
			};
		});
	}

	// Audio file

	get blob() {
		return this.audioBlob;
	}
	get audioData() {
		return this.buffer?.getChannelData(0) || null;
	}
	get sampleRate() {
		return this.buffer?.sampleRate || 0;
	}
	/** Clears the currently loaded audio file. */
	clearAudio(): void {
		this.stop();
		this.audioBlob = null;
		this.buffer = null;
	}
	/** Load a new audio file. */
	async loadAudio(blob: Blob): Promise<void> {
		this.isLoading = true;
		this.audioBlob = blob;
		const arrayBuffer = await blob.arrayBuffer();
		const decoded = await this.ctx.decodeAudioData(arrayBuffer);
		if (decoded.length === 0) {
			throw new Error('Audio file is empty or could not be decoded');
		}
		this.buffer = decoded;
		this.stop();
		this.isLoading = false;
	}

	// Helpers

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

	/**
	 * Create an {@link AudioBufferSourceNode} and connect it appropriately.
	 * Also sets the sourceNode playbackRate to the current playbackRate.
	 *
	 * Audio Pipeline:
	 *  AudioBufferSourceNode -> Pitchshift (Rubberband) -> Gain -> Analyzer -> Destination
	 */
	private createSource(): AudioBufferSourceNode | null {
		if (!this.buffer || !this.pitchshiftNode) return null;
		const source = this.ctx.createBufferSource();
		source.buffer = this.buffer;
		source.playbackRate.value = this.playbackRate;
		source
			.connect(this.pitchshiftNode)
			.connect(this.gainNode)
			.connect(this.analyzer)
			.connect(this.ctx.destination);
		source.onended = () => {
			if (this.isPlaying && !this.suppressEnded) {
				// Pause at the end of the buffer instead of stopping, so that the playhead remains at the end
				this.pause();
			}
			this.suppressEnded = false;
		};
		return source;
	}

	/**
	 * Helper for executing an action that may be performend during playback.
	 * If we are currently playing, we pause, perform the action, and resume playback at the same position.
	 * If {@link offset} is set inside {@link fn}, the playback will be resumed at the new position.
	 */
	private doDuringPlayback(fn: () => void) {
		const wasPlaying = this.isPlaying;
		if (wasPlaying) {
			this.suppressEnded = true;
			this.pause();
		}
		fn();
		if (wasPlaying) {
			this.play();
		}
	}

	// Audio analysis

	/**
	 * The peak of the current audio buffer at the current position using a discrete maximum over the time domain data of the analyzer node.
	 */
	getPeak(): number {
		if (!this.isPlaying) return 0;

		this.analyzer.getFloatTimeDomainData(this.analyzerData);
		let peak = 0;
		for (let i = 0; i < this.analyzerData.length; i++) {
			const v = Math.abs(this.analyzerData[i]);
			if (v > peak) peak = v;
		}

		return peak;
	}

	// Playback

	/** Whether the audio is currently playing. */
	get playing() {
		return this.isPlaying;
	}
	/** Pause or play the audio. */
	togglePlay(): void {
		if (this.isPlaying) this.pause();
		else this.play();
	}
	/**
	 * Create a new source node and start playback at the current {@link offset}.
	 * Also applies any loop markers.
	 */
	play(): void {
		if (this.isPlaying || !this.buffer) return;

		// Resume context if suspended (browser policy)
		if (this.ctx.state === 'suspended') {
			this.ctx.resume();
		}

		this.sourceNode = this.createSource();
		if (!this.sourceNode) return;

		this.applyLoop();
		this.startTime = this.ctx.currentTime;
		this.sourceNode.start(0, this.offset * this.playbackRate);

		this.isPlaying = true;
		this.startClock();
	}
	/**
	 * Pause playback.
	 * Sets the playback position to the current playback time, so that we can resume playback at the same position.
	 */
	pause(): void {
		if (!this.isPlaying) return;
		this.offset = this.playbackPosition;
		this.sourceNode?.stop();
		this.sourceNode = null;
		this.isPlaying = false;
	}
	/**
	 * Stop playback by stopping the internal clock.
	 * Also, the playback position is reset to 0.
	 */
	stop(): void {
		this.sourceNode?.stop();
		this.sourceNode = null;
		this.offset = 0;
		this.isPlaying = false;
		this.stopClock();
	}

	// Seeking

	/**
	 * Set the playback position to the given time.
	 * If the audio is currently playing, the playback will be paused and resumed at the new position.
	 * If a loop is enabled, the playback position will be clamped to the loop markers.
	 * @param time The time to seek to, in playback-time seconds.
	 */
	seekTo(time: number): void {
		this.doDuringPlayback(() => {
			const playbackLoopMarkers = this.loopMarkers
				? {
						start: this.loopMarkers.start / this.playbackRate,
						end: this.loopMarkers.end / this.playbackRate
					}
				: null;

			// Clamp target time while accounting for loop
			const minTime = this.enableLooping && playbackLoopMarkers ? playbackLoopMarkers.start : 0;
			const maxTime =
				this.enableLooping && playbackLoopMarkers ? playbackLoopMarkers.end : this.duration;
			const clamped = Math.max(minTime, Math.min(time, maxTime));
			this.offset = clamped;
		});
	}
	/**
	 * Move the playback position by the given delta.
	 * @param delta The time to seek by, in playback-time seconds.
	 */
	seekBy(delta: number): void {
		this.seekTo(this.playbackPosition + delta);
	}

	// Playback speed

	/** The current playback speed (1.0 = normal, 2.0 = double, 0.5 = half). */
	get playbackSpeed() {
		return this.playbackRate;
	}
	/**
	 * Set the playback speed to a new value.
	 * @param newRate The new playback speed (1.0 = normal, 2.0 = double, 0.5 = half).
	 */
	setPlaybackSpeed(newRate: number): void {
		// Keep track of original position in buffer time, before playbackRate is updated.
		const bufferPosition = this.bufferPosition;

		this.doDuringPlayback(() => {
			// Set new playbackRate and start source at new offset
			this.playbackRate = newRate;
			this.offset = bufferPosition / newRate;
		});

		// Counteract pitch distortion that comes from setting the sourceNode playbackRate.
		this.pitchshiftNode?.setPitch(1 / newRate);
	}
	playbackSpeedUp() {
		this.setPlaybackSpeed(playbackRateParam.increment(this.playbackRate));
	}
	playbackSpeedDown() {
		this.setPlaybackSpeed(playbackRateParam.decrement(this.playbackRate));
	}

	// Volume

	volumeUp() {
		this.volume = volumeParam.increment(this.volume);
	}
	volumeDown() {
		this.volume = volumeParam.decrement(this.volume);
	}
	volumeMute() {
		if (this.volume > 0) this.volume = 0;
		else this.volume = 1;
	}

	// Looping

	/** Current loop markers in buffer time or null if no loop is set. */
	get loop() {
		return this.loopMarkers;
	}
	/**
	 * Apply the loop markers to the source node.
	 */
	private applyLoop() {
		if (!this.sourceNode) return;
		this.sourceNode.loop = this.enableLooping;
		this.sourceNode.loopStart = this.loopMarkers?.start || 0;
		this.sourceNode.loopEnd = this.loopMarkers?.end || 0;
	}
	/**
	 * Set a loop region and enable looping.
	 * If the audio is currently playing, the playback will be paused and resumed at the start of the loop.
	 * @param start Start of the loop, in buffer-time seconds.
	 * @param end  End of the loop, in buffer-time seconds.
	 */
	setLoop(start: number, end: number) {
		this.doDuringPlayback(() => {
			// Set loop
			this.enableLooping = true;
			this.loopMarkers = { start, end };

			// Set the playback to start at the start of the loop
			this.offset = start / this.playbackRate;
		});
	}
	updateLoop(start: number, end: number) {
		if (!this.loopMarkers) return;
		// Only set the marker varibles, because the loop is disabled.
		// They will be applied when the loop is enabled again.
		if (!this.enableLooping) this.loopMarkers = { start, end };
		// Call setLoop if the loop is enabled.
		// This will pause the playback and resume it at the start of the loop,
		// to ensure we stay within the loop region.
		else this.setLoop(start, end);
	}
	/** Clear the current loop region (if any) and disable looping. */
	clearLoop() {
		if (!this.loopMarkers) return;
		this.doDuringPlayback(() => {
			this.enableLooping = false;
			this.loopMarkers = null;
		});
	}
	/**
	 * Toggle between enabling/disabling looping.
	 * Will jump to the start of the loop if necessary.
	 */
	toggleLooping() {
		if (!this.loopMarkers) return;
		this.doDuringPlayback(() => {
			this.enableLooping = !this.enableLooping;
			if (this.enableLooping) this.offset = (this.loopMarkers?.start || 0) / this.playbackRate;
		});
	}
}
const audioEngine = new AudioEngine();
export default audioEngine;
