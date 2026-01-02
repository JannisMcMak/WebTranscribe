export type PitchFrame = {
	time: number;
	freq: number | null;
	confidence: number;
};

export const audioState = $state({
	blob: null as Blob | null,
	buffer: null as AudioBuffer | null,
	duration: 0,
	sampleRate: 44100
});

export const playbackState = $state({
	isPlaying: false,
	currentTime: 0,
	rate: 1.0
});

export const analysisState = $state({
	pitchTrack: <PitchFrame[]>[],
	beats: <number[]>[],
	bpm: <number | null>null
});
