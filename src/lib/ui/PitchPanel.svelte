<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { onMount } from 'svelte';

	// MIDI vertical range
	const MIN_MIDI = 36; // C2
	const MAX_MIDI = 96; // C7

	// Pitch data
	const midiNotes = $derived(
		analysisState.pitches.map((hz) => {
			if (!hz || !isFinite(hz)) return -1;
			const midi = 69 + 12 * Math.log2(hz / 440);
			if (midi < MIN_MIDI || midi > MAX_MIDI) return -1;
			return midi;
		})
	);

	// Pitch data vertical range
	const MIN_NOTE = $derived(Math.min(...midiNotes.filter((n) => n >= 0)));
	const MAX_NOTE = $derived(Math.max(...midiNotes));
	const NOTE_RANGE = $derived(MAX_NOTE - MIN_NOTE);

	// Visible time range (seconds)
	const visibleDuration = $derived(waveformState.zoom * audioEngine.bufferDuration);

	// Canvas dimensions / Sizing
	let { w }: { w: number } = $props();
	const h = 400;
	const LEGEND_WIDTH = 25;
	const NOTE_HEIGHT = $derived(h / NOTE_RANGE);

	// Canvas references
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let labelsCanvas: HTMLCanvasElement;
	let labelsCtx: CanvasRenderingContext2D;

	// Note labels
	const NOTE_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
	function midiToNoteName(midi: number) {
		midi = Math.round(midi);
		const pitchClassIndex = ((midi % 12) + 12) % 12;
		const octave = Math.floor(midi / 12) - 1;
		return `${NOTE_NAMES[pitchClassIndex]}${octave}`;
	}

	function drawGrid() {
		if (!labelsCanvas) return;
		if (!labelsCtx) labelsCtx = labelsCanvas.getContext('2d')!;

		labelsCtx.clearRect(0, 0, LEGEND_WIDTH, h);

		labelsCtx.font = '11px system-ui';
		labelsCtx.textAlign = 'right';
		labelsCtx.textBaseline = 'middle';

		for (let midi = MIN_NOTE; midi <= MAX_NOTE; midi++) {
			const y = h - ((midi - MIN_NOTE) / NOTE_RANGE) * h;

			const isOctave = midi % 12 === 0;

			// horizontal line
			ctx.strokeStyle = isOctave
				? getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground')
				: getComputedStyle(document.documentElement).getPropertyValue('--ring');
			ctx.lineWidth = isOctave ? 1.5 : 1;

			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(w, y);
			ctx.stroke();

			// note labels (only once per pitch class, e.g. C, D, E…)
			labelsCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
				'--accent-foreground'
			);
			labelsCtx.fillText(midiToNoteName(midi), LEGEND_WIDTH - 4, y);
		}

		// vertical separator
		labelsCtx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue(
			'--accent-foreground'
		);
		labelsCtx.beginPath();
		labelsCtx.moveTo(LEGEND_WIDTH, 0);
		labelsCtx.lineTo(LEGEND_WIDTH, h);
		labelsCtx.stroke();
	}

	function render(pitches: Float32Array) {
		if (!canvas) return;
		if (!ctx) ctx = canvas.getContext('2d')!;
		if (!pitches || pitches.length === 0) return;

		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
			'--accent-foreground'
		);

		drawGrid();

		const frameDuration = audioEngine.bufferDuration / pitches.length;

		// determine visible frame indices
		const startTime = waveformState.scrollPosition;
		const endTime = startTime + visibleDuration;

		const startFrame = Math.max(0, Math.floor(startTime / frameDuration));
		const endFrame = Math.min(pitches.length, Math.ceil(endTime / frameDuration));

		for (let i = startFrame; i < endFrame; i++) {
			const midi = midiNotes[i];
			if (midi < 0) continue;

			// horizontal position
			const time = i * frameDuration - startTime;
			const x = (time / visibleDuration) * w;

			// vertical position (piano roll: high notes on top)
			const y = h - ((midi - MIN_NOTE) / NOTE_RANGE) * h;

			// draw a small rectangle per frame
			const frameWidth = (frameDuration / visibleDuration) * w;

			ctx.fillRect(x, y - 1, frameWidth, NOTE_HEIGHT);
		}
	}
	onMount(() => render(analysisState.pitches));
	$effect(() => render(analysisState.pitches));
</script>

<div class="relative">
	<canvas bind:this={labelsCanvas} width={50} height={h} class="absolute top-0 left-0"> </canvas>
	<canvas bind:this={canvas} width={w} height={h}> </canvas>
</div>
