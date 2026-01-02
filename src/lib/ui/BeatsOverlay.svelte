<script lang="ts">
	import { analysisState } from '@/lib/stores.svelte';
	import audioEngine from '../engine/engine.svelte';

	let canvas: HTMLCanvasElement;

	$effect(() => {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw beats
		ctx.fillStyle = '#f00';
		for (const beat of analysisState.beats) {
			const x = beat * (canvas.width / audioEngine.duration);
			ctx.fillRect(x, 0, 1, canvas.height);
		}
	});
</script>

<canvas bind:this={canvas} width={document.documentElement.clientWidth} class="overlay"></canvas>

<style>
	.overlay {
		width: 100%;
		height: 50px;
		position: absolute;
		pointer-events: none;
		top: 0;
	}
</style>
