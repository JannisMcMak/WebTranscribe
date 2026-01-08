import type { PitchFrame } from './types';

export const analysisState = $state({
	pitchTrack: <PitchFrame[]>[],
	beats: <number[]>[],
	bpm: <number | null>null
});

export const waveformState = $state({
	/** Buffer position in seconds that the user is hovering over (or 0 if not hovering). */
	hoverPosition: 0,
	/** Zoom level between 0 and 1 (fraction of the total duration that is visible). */
	zoom: 1,
	/** Scroll position in seconds (i.e., what time is at the start of the waveform). */
	scrollPosition: 0,
	resetZoom: <() => void>(() => {}),
	centerToPlayhead: <() => void>(() => {})
});
