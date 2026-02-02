<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { TW_SPACING } from '$lib/utils';

	let analysisData = $derived(analysisState.pitch);

	// Pitch data
	const midiNotes = $derived(
		analysisData.values.map((hz) => {
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
	const MIN_VISIBLE_NOTE = $derived(
		Math.floor(MIN_NOTE + (NOTE_RANGE - VISIBLE_RANGE) * verticalCenter)
	);
	const MAX_VISIBLE_NOTE = $derived(MIN_VISIBLE_NOTE + VISIBLE_RANGE);

	// Canvas dimensions / sizing
	let { w, h }: { w: number; h: number } = $props();
	const width = $derived(w - 16 * TW_SPACING); // Space on the left for waveform view control buttons (= size of the piano keys)
	const NOTE_HEIGHT = $derived(h / VISIBLE_RANGE);

	// References
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;
	let pianoRoll: HTMLDivElement;

	// Note UI
	function isMidiKeyBlack(midi: number) {
		return [1, 3, 6, 8, 10].includes(midi % 12);
	}

	// --- Grid drawing ---
	function drawGrid() {
		for (let midi = MIN_VISIBLE_NOTE; midi <= MAX_VISIBLE_NOTE; midi++) {
			const y = h - ((midi - MIN_VISIBLE_NOTE) / VISIBLE_RANGE) * h;

			const isOctave = midi % 12 === 11;

			// horizontal line
			ctx.strokeStyle = isOctave
				? getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground')
				: getComputedStyle(document.documentElement).getPropertyValue('--muted');
			ctx.beginPath();
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.stroke();

			// fill black keys
			if (isMidiKeyBlack(midi)) {
				ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted');
				ctx.fillRect(0, y, width, NOTE_HEIGHT);
			}

			// fill hovered
			if (midi === currentHoveredMidi) {
				ctx.fillStyle = '#0000001C';
				ctx.fillRect(0, y, width, NOTE_HEIGHT);
			}
		}
	}

	// --- Main render loop ---
	$effect(() => {
		if (!canvas) return;
		if (!ctx) ctx = canvas.getContext('2d')!;
		if (!analysisData.values || analysisData.values.length === 0) return;

		const numFrames = analysisData.perFrame.length;

		ctx.clearRect(0, 0, width, h);
		drawGrid();
		ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary');

		const frameDuration = audioEngine.bufferDuration / numFrames;

		// determine visible frame indices
		const startTime = waveformState.scrollPosition;
		const endTime = startTime + visibleDuration;

		const startFrame = Math.max(0, Math.floor(startTime / frameDuration));
		const endFrame = Math.min(numFrames, Math.ceil(endTime / frameDuration));

		for (let i = startFrame; i < endFrame; i++) {
			const pitchOffset = analysisData.offsets[i];
			const numPitches = analysisData.perFrame[i];

			const frameMidiNotes = midiNotes.slice(pitchOffset, pitchOffset + numPitches);

			// Draw each note
			frameMidiNotes.forEach((midi) => {
				if (midi < 0) return;

				// horizontal position
				const time = i * frameDuration - startTime;
				const x = (time / visibleDuration) * width;

				// vertical position (piano roll: high notes on top)
				const y = h - ((midi - MIN_VISIBLE_NOTE) / VISIBLE_RANGE) * h;

				// draw a small rectangle per frame
				const frameWidth = (frameDuration / visibleDuration) * width;

				ctx.fillRect(x, y - 1, frameWidth, NOTE_HEIGHT);
			});
		}
	});

	// --- Canvas interaction ---
	function onWheel(e: WheelEvent) {
		if (!canvas) return;
		e.preventDefault();

		if (e.ctrlKey) {
			// PINCH → VERTICAL ZOOM
			const zoomSpeed = 0.002;
			const zoomDelta = Math.exp(-e.deltaY * zoomSpeed);
			const newZoom = Math.min(20, Math.max(1, verticalZoom * zoomDelta));
			if (newZoom === verticalZoom) return;
			verticalZoom = newZoom;
		} else {
			// SCROLL
			if (Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
				// VERTICAL PAN
				const panSpeed = -0.002;
				verticalCenter = Math.min(1, Math.max(0, verticalCenter + e.deltaY * panSpeed));
			} else {
				// HORIZONTAL PAN
				waveformState.handleScroll(e);
			}
		}
	}

	// --- Piano roll ---
	function midiToFreq(midi: number) {
		return (440 / 32) * 2 ** ((midi - 9) / 12);
	}
	let pianoRollPressed = $state(false);
	let currentHoveredMidi = $state(0);
	$effect(() => {
		if (pianoRollPressed && currentHoveredMidi > 0) {
			audioEngine.playNote(midiToFreq(currentHoveredMidi));
		} else {
			audioEngine.stopTone();
		}
	});
</script>

<div onwheel={onWheel} class="relative flex rounded-xl bg-card">
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={pianoRoll}
		class="relative h-full w-16 overflow-hidden rounded-l-xl bg-white select-none"
		onmousedown={() => (pianoRollPressed = true)}
		onmouseup={() => (pianoRollPressed = false)}
		onmouseleave={() => {
			pianoRollPressed = false;
			currentHoveredMidi = 0;
		}}
	>
		{#each Array(Math.ceil(VISIBLE_RANGE)) as _, i}
			{@const midi = MIN_VISIBLE_NOTE + i}
			{@const pitchClassIndex = ((midi % 12) + 12) % 12}
			{@const octave = Math.floor(midi / 12) - 1}
			{@const isBlack = isMidiKeyBlack(midi)}
			<div
				class="absolute right-0 flex cursor-pointer items-center justify-end"
				class:black={isBlack}
				class:white={!isBlack}
				class:hover:opacity-50={isBlack}
				class:hover:brightness-90={!isBlack}
				onmouseenter={() => (currentHoveredMidi = midi)}
				style="
					top: {h - (midi - MIN_VISIBLE_NOTE) * NOTE_HEIGHT}px;
					height: {NOTE_HEIGHT}px;
				"
			>
				{#if pitchClassIndex === 0}
					<span class="text-[8px] leading-0">C{octave}</span>
				{/if}
			</div>
		{/each}
	</div>

	<canvas bind:this={canvas} {width} height={h} class="flex-1 rounded-r-xl"> </canvas>
</div>

<style>
	.white {
		width: 100%;
		background: white;
		z-index: 1;
	}

	.black {
		width: 60%;
		background: black;
		left: 0;
		z-index: 2;
	}
</style>
