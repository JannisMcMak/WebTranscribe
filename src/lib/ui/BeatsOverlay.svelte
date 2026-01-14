<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';

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

		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');

		for (let beat of visibleBeats) {
			beat = beat - waveformState.scrollPosition;
			const relX = beat / visibleDuration;
			const x = Math.round(relX * canvas.width);
			ctx.fillRect(x, 0, 1, canvas.height);
		}
	});
</script>

<canvas
	bind:this={canvas}
	width={document.documentElement.clientWidth - 2 * 48}
	height={12}
	class="pointer-events-none absolute bottom-4"
></canvas>
