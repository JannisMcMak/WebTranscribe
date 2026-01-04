import type { PitchFrame } from './types';

export const analysisState = $state({
	pitchTrack: <PitchFrame[]>[],
	beats: <number[]>[],
	bpm: <number | null>null
});

export const waveformState = $state({
	/** Hover position (0-1) inside the waveform in x direction from the left. */
	hoverPosition: 0,
	resetZoom: <() => void>(() => {}),
	centerToPlayhead: <() => void>(() => {})
});
