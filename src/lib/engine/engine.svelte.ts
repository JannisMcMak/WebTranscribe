class AudioEngine {
	// ----- Web Audio -----
	private ctx: AudioContext;
	private sourceNode: AudioBufferSourceNode | null = null;
	private gainNode: GainNode;

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
	/** Time in seconds when playback started. */
	private startTime = $state(0);
	/** Time in seconds where to start playback. */
	private offset = $state(0);

	// ----- Controls state -----
	/** Playback speed. */
	playbackRate = $state(1);
	/** Volume (number betwee 0 and 2. Default 1). */
	volume = $state(1);

	// ----- Other -----
	/** Wether to ignore the AudioBufferSourceNode `ended` event (used when seeking). */
	private suppressEnded = false;

	// ---- Derived values -----
	/** Duration in seconds of the current audio. */
	duration = $derived(this.buffer ? this.buffer.duration : 0);
	/** Current playback position in seconds. */
	playbackPosition = $derived.by(() => {
		if (!this.buffer) return 0;
		if (this.isPlaying) {
			return Math.min(
				(this.offset + (this.now - this.startTime)) * this.playbackRate,
				this.duration
			);
		}
		return this.offset;
	});

	constructor() {
		this.ctx = new AudioContext();
		this.gainNode = this.ctx.createGain();

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
			this.startClock();
		};
		this.rafID = requestAnimationFrame(loop);
	}
	private stopClock(): void {
		cancelAnimationFrame(this.rafID!);
	}

	private createSource(): AudioBufferSourceNode | null {
		if (!this.buffer) return null;
		const source = this.ctx.createBufferSource();
		source.buffer = this.buffer;
		source.connect(this.gainNode).connect(this.ctx.destination);
		source.onended = () => {
			if (this.isPlaying && !this.suppressEnded) {
				this.stop();
			}
			this.suppressEnded = false;
		};
		return source;
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
		this.sourceNode.start(0, this.offset);

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
		this.suppressEnded = true;

		if (wasPlaying) {
			this.stop();
		}

		// Clamp target time
		const clamped = Math.max(0, Math.min(time, this.duration));
		this.offset = clamped;

		// If currently playing, restart source at new offset
		if (wasPlaying) {
			this.play();
			this.play();
		}
	}
}
const audioEngine = new AudioEngine();
export default audioEngine;
