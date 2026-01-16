<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';

	// Pitch data
	const midiNotes = $derived(
		analysisState.pitches.map((hz) => {
			if (!hz || !isFinite(hz)) return -1;
			const midi = 69 + 12 * Math.log2(hz / 440);
			if (midi < MIN_NOTE || midi > MAX_NOTE) return -1;
			if (isNaN(midi)) return -1;
			return midi;
		})
	);

	// Visible time range (seconds)
	const visibleDuration = $derived(waveformState.zoom * audioEngine.bufferDuration);

	// Vertical zoom
	let verticalZoom = $state(2); // 1 = full range
	let verticalCenter = $state(0.5); // normalized [0–1]

	// MIDI vertical range
	const MIN_NOTE = 36; // C2
	const MAX_NOTE = 96; // C7
	const NOTE_RANGE = $derived(MAX_NOTE - MIN_NOTE);

	// Visible pitch range (MIDI)
	const VISIBLE_RANGE = $derived(NOTE_RANGE / verticalZoom);
	const MIN_VISIBLE_NOTE = $derived(MIN_NOTE + (NOTE_RANGE - VISIBLE_RANGE) * verticalCenter);
	const MAX_VISIBLE_NOTE = $derived(MIN_VISIBLE_NOTE + VISIBLE_RANGE);

	// Canvas dimensions / Sizing
	let { w, h }: { w: number; h: number } = $props();
	const LEGEND_WIDTH = 25;
	const NOTE_HEIGHT = $derived(h / VISIBLE_RANGE);

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

		for (let midi = MIN_VISIBLE_NOTE; midi <= MAX_VISIBLE_NOTE; midi++) {
			const y = h - ((midi - MIN_VISIBLE_NOTE) / VISIBLE_RANGE) * h;

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
			labelsCtx.fillText(midiToNoteName(midi), LEGEND_WIDTH - 4, y + NOTE_HEIGHT / 2);
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

	$effect(() => {
		if (!canvas) return;
		if (!ctx) ctx = canvas.getContext('2d')!;
		if (!analysisState.pitches || analysisState.pitches.length === 0) return;

		const numFrames = analysisState.pitchesPerFrame.length;

		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue(
			'--accent-foreground'
		);

		drawGrid();

		const frameDuration = audioEngine.bufferDuration / numFrames;

		// determine visible frame indices
		const startTime = waveformState.scrollPosition;
		const endTime = startTime + visibleDuration;

		const startFrame = Math.max(0, Math.floor(startTime / frameDuration));
		const endFrame = Math.min(numFrames, Math.ceil(endTime / frameDuration));

		for (let i = startFrame; i < endFrame; i++) {
			const pitchOffset = analysisState.pitchOffsets[i];
			const numPitches = analysisState.pitchesPerFrame[i];

			const frameMidiNotes = midiNotes.slice(pitchOffset, pitchOffset + numPitches);

			// Draw each note
			frameMidiNotes.forEach((midi) => {
				if (midi < 0) return;

				// horizontal position
				const time = i * frameDuration - startTime;
				const x = (time / visibleDuration) * w;

				// vertical position (piano roll: high notes on top)
				const y = h - ((midi - MIN_VISIBLE_NOTE) / VISIBLE_RANGE) * h;

				// draw a small rectangle per frame
				const frameWidth = (frameDuration / visibleDuration) * w;

				ctx.fillRect(x, y - 1, frameWidth, NOTE_HEIGHT);
			});
		}
	});

	function onWheel(e: WheelEvent) {
		if (!canvas) return;
		e.preventDefault();

		const rect = canvas.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const cursorNorm = 1 - y / h; // 0 bottom, 1 top

		// ==========================
		// PINCH → VERTICAL ZOOM
		// ==========================
		if (e.ctrlKey) {
			e.preventDefault();

			const zoomSpeed = 0.002;
			const zoomDelta = Math.exp(-e.deltaY * zoomSpeed);

			const newZoom = Math.min(20, Math.max(1, verticalZoom * zoomDelta));
			if (newZoom === verticalZoom) return;

			const visibleBefore = NOTE_RANGE / verticalZoom;
			const visibleAfter = NOTE_RANGE / newZoom;

			const pitchAtCursor = MIN_VISIBLE_NOTE + visibleBefore * cursorNorm;

			const newMin = pitchAtCursor - visibleAfter * cursorNorm;

			verticalCenter = Math.min(1, Math.max(0, (newMin - MIN_NOTE) / (NOTE_RANGE - visibleAfter)));

			verticalZoom = newZoom;
			return;
		}

		// ==========================
		// SCROLL → VERTICAL PAN
		// ==========================
		const panSpeed = -0.002;
		const delta = e.deltaY * panSpeed;

		verticalCenter = Math.min(1, Math.max(0, verticalCenter + delta));
	}
</script>

<div onwheel={onWheel} class="relative py-1">
	<canvas bind:this={labelsCanvas} width={50} height={h} class="absolute top-0 left-0 rounded-xl">
	</canvas>
	<canvas bind:this={canvas} width={w} height={h} class="rounded-xl"> </canvas>
</div>
