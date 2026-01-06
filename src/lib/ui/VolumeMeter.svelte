<script lang="ts">
	import audioEngine from '$lib/engine/engine.svelte';
	import { onDestroy, onMount } from 'svelte';

	const w = 7;
	let { h }: { h: number } = $props();

	let canvas: HTMLCanvasElement;
	const gradient = $derived.by(() => {
		const g = ctx.createLinearGradient(0, h, 0, 0);
		g.addColorStop(0.0, '#0f0'); // bottom (silence)
		g.addColorStop(0.7, '#0f0'); // -12 dB
		g.addColorStop(0.85, '#ff0'); // -3 dB
		g.addColorStop(1.0, '#f00'); // 0 dB
		return g;
	});

	let ctx: CanvasRenderingContext2D;
	let running = false;

	function draw() {
		if (!running) return;

		const peak = audioEngine.getPeak();
		renderMeter(peak);

		requestAnimationFrame(draw);
	}

	onMount(() => {
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Could not get canvas context');
		}
		ctx = context;
		running = true;
		draw();
	});

	onDestroy(() => {
		running = false;
	});

	let displayed = 0;
	function smoothPeak(input: number, attack = 0.6, release = 0.95) {
		if (input > displayed) {
			displayed = attack * input + (1 - attack) * displayed;
		} else {
			displayed = release * displayed;
		}
		return displayed;
	}

	function renderMeter(peak: number) {
		const p = smoothPeak(peak);

		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = gradient;
		ctx.fillRect(0, h * (1 - p), w, h * p);
	}

	const LABELS_DB = [0, -3, -6, -12, -18, -24, -48];
	function dbToY(db: number, height: number, minDb = -60) {
		const clamped = Math.max(db, minDb);
		return height * (1 - (clamped - minDb) / -minDb);
	}
</script>

<div style="height: {h}px;" class="relative ml-1.25 py-1.25">
	<div class="absolute top-0 -left-2.5 h-full">
		{#each LABELS_DB as db}
			<div
				class="pointer-events-none absolute left-5.5 -translate-y-1/2 text-[0.6rem] text-muted-foreground select-none"
				style="top: {dbToY(db, h) + 10}px"
			>
				{db}
			</div>
		{/each}
	</div>

	<canvas class="rounded-md bg-card" bind:this={canvas} width={w} height={h - 10}></canvas>
</div>
