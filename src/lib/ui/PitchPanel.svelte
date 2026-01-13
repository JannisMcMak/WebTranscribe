<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	const FRAME_SIZE = 2048;

	// seconds per pitch frame
	const frameDuration = FRAME_SIZE / audioEngine.sampleRate;

	// visible time range (seconds)
	const visibleDuration = $derived(waveformState.zoom * audioEngine.bufferDuration);

	// convert Hz → MIDI note number
	function hzToMidi(hz: number) {
		return 69 + 12 * Math.log2(hz / 440);
	}

	// piano-roll vertical range
	const MIN_MIDI = 36; // C2
	const MAX_MIDI = 96; // C7
	const MIDI_RANGE = MAX_MIDI - MIN_MIDI;

	$effect(() => {
		if (!canvas) return;
		if (!ctx) ctx = canvas.getContext('2d')!;

		const { width, height } = canvas;
		ctx.clearRect(0, 0, width, height);

		const pitches = analysisState.pitches;
		if (!pitches || pitches.length === 0) return;

		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');

		// determine visible frame indices
		const startTime = waveformState.scrollPosition;
		const endTime = startTime + visibleDuration;

		const startFrame = Math.max(0, Math.floor(startTime / frameDuration));
		const endFrame = Math.min(pitches.length, Math.ceil(endTime / frameDuration));

		for (let i = startFrame; i < endFrame; i++) {
			const hz = pitches[i];
			if (!hz || !isFinite(hz)) continue;

			const midi = hzToMidi(hz);
			if (midi < MIN_MIDI || midi > MAX_MIDI) continue;

			// horizontal position
			const time = i * frameDuration - startTime;
			const x = (time / visibleDuration) * width;

			// vertical position (piano roll: high notes on top)
			const y = height - ((midi - MIN_MIDI) / MIDI_RANGE) * height;

			// draw a small rectangle per frame
			const frameWidth = (frameDuration / visibleDuration) * width;

			ctx.fillRect(x, y - 1, Math.max(1, frameWidth), 2);
		}
	});
</script>

<canvas
	bind:this={canvas}
	width={document.documentElement.clientWidth}
	height={96}
	class="pointer-events-none absolute bottom-28 w-full bg-red-500 "
></canvas>
