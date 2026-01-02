<script lang="ts">
	import { analysisState } from '@/lib/stores.svelte';
	import type { PitchFrame } from '@/lib/types';

	type MidiNote = {
		note: number;
		start: number;
		duration: number;
	};

	function pitchFramesToMidiNotes(frames: PitchFrame[]): MidiNote[] {
		if (frames.length === 0) return [];
		const freqToMidi = (freq: number) => Math.round(69 + 12 * Math.log2(freq / 440));

		const notes: MidiNote[] = [];

		let activeNote: {
			note: number;
			start: number;
		} | null = null;

		for (let i = 0; i < frames.length; i++) {
			const frame = frames[i];

			// Silence
			if (frame.freq == null) {
				if (activeNote) {
					notes.push({
						note: activeNote.note,
						start: activeNote.start,
						duration: frame.time - activeNote.start
					});
					activeNote = null;
				}
				continue;
			}

			const midi = freqToMidi(frame.freq);

			// Start new note
			if (!activeNote) {
				activeNote = {
					note: midi,
					start: frame.time
				};
				continue;
			}

			// Pitch change → end previous note
			if (midi !== activeNote.note) {
				notes.push({
					note: activeNote.note,
					start: activeNote.start,
					duration: frame.time - activeNote.start
				});

				activeNote = {
					note: midi,
					start: frame.time
				};
			}
		}

		// Close trailing note
		const lastFrame = frames[frames.length - 1];
		if (activeNote && lastFrame.freq != null) {
			notes.push({
				note: activeNote.note,
				start: activeNote.start,
				duration: lastFrame.time - activeNote.start
			});
		}

		return notes;
	}

	let notes = $derived(pitchFramesToMidiNotes(analysisState.pitchTrack));

	// Visual parameters
	const noteHeight = 4; // px per semitone

	// Compute bounds
	const minNote = $derived(Math.min(...notes.map((n) => n.note)));
	const maxNote = $derived(Math.max(...notes.map((n) => n.note)));
	const totalTime = $derived(Math.max(...notes.map((n) => n.start + n.duration)));

	// Normalized helpers (0–1)
	function xFrac(time: number) {
		return time / totalTime;
	}

	function wFrac(duration: number) {
		return duration / totalTime;
	}

	function yFor(note: number) {
		return (maxNote - note) * noteHeight;
	}
</script>

{#if notes.length > 0}
	<div class="piano-roll" style={`height: ${(maxNote - minNote + 1) * noteHeight}px;`}>
		<!-- horizontal pitch grid -->
		{#each Array(maxNote - minNote + 1) as _, i}
			<div class="grid-row" style={`top: ${i * noteHeight}px`}></div>
		{/each}

		<!-- notes -->
		{#each notes as n}
			<div
				class="note"
				style={`left: ${xFrac(n.start) * 100}%; ` +
					`top: ${yFor(n.note)}px; ` +
					`width: ${wFrac(n.duration) * 100}%; ` +
					`height: ${noteHeight - 2}px;`}
				title={`MIDI ${n.note}`}
			></div>
		{/each}
	</div>
{/if}

<style>
	.piano-roll {
		position: relative;
		width: 100%;
		border: 1px solid #333;
		overflow: hidden;
	}

	.note {
		position: absolute;
		background: #333;
		border-radius: 3px;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.4);
	}

	.grid-row {
		position: absolute;
		left: 0;
		right: 0;
		height: 1px;
		background: rgba(255, 255, 255, 0.05);
	}
</style>
