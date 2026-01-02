const audioUtils = {
	bufferToBlob(buffer: AudioBuffer): Blob {
		return new Blob([buffer], { type: 'audio/wav' });
	},

	bufferToPeaks(buffer: AudioBuffer): Float32Array[] {
		return [buffer.getChannelData(0), buffer.getChannelData(1)];
	}
};
export default audioUtils;
