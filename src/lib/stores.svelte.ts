import type Essentia from 'essentia.js/dist/core_api';

export const analysisState = $state({
	essentia: <Essentia>{},

	pitchesLoading: false,
	pitches: <Float32Array>new Float32Array([]),
	pitchesPerFrame: <Int32Array>new Int32Array([]),
	pitchOffsets: <Int32Array>new Int32Array([]),

	beatsLoading: false,
	beats: <Float32Array>new Float32Array([])
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
