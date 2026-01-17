<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { TW_SPACING } from '$lib/utils';

	let { w }: { w: number } = $props();
	const width = $derived(w - 16 * TW_SPACING); // Space on the left for waveform view control buttons
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	const visibleDuration = $derived(waveformState.zoom * audioEngine.bufferDuration);
	const visibleBeats = $derived(
		analysisState.beats.filter(
			(n) => n > waveformState.scrollPosition && n < waveformState.scrollPosition + visibleDuration
		)
	);

	$effect(() => {
		if (!ctx) ctx = canvas.getContext('2d')!;

		ctx.clearRect(0, 0, width, canvas.height);
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');

		for (let beat of visibleBeats) {
			const relSeconds = beat - waveformState.scrollPosition;
			const relX = relSeconds / visibleDuration;
			ctx.fillRect(relX * width, 0, 1, canvas.height);
		}
	});
</script>

<canvas bind:this={canvas} {width} height={12} class="pointer-events-none absolute bottom-8"
></canvas>
