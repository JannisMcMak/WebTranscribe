import type { PitchFrame } from './types';

export const analysisState = $state({
	pitchTrack: <PitchFrame[]>[],
	beats: <number[]>[],
	bpm: <number | null>null
});

export const userInput = $state({
	hoverPosition: 0
});
