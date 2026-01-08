import FFT from 'fft.js';

export default function extractOnsets(buffer: Float32Array, sampleRate: number): number[] {
	const startTime = new Date();

	const frameSize = 2048;
	const hopSize = 512;

	const fft = new FFT(frameSize);
	const window = hann(frameSize);

	const prevMag = new Float32Array(frameSize / 2);
	const flux: number[] = [];

	// --- Analysis ---
	for (let i = 0; i + frameSize < buffer.length; i += hopSize) {
		const frame = new Float32Array(frameSize);

		for (let j = 0; j < frameSize; j++) {
			frame[j] = buffer[i + j] * window[j];
		}

		const spectrum = fft.createComplexArray();
		fft.realTransform(spectrum, frame);
		fft.completeSpectrum(spectrum);

		let sum = 0;
		for (let k = 0; k < frameSize / 2; k++) {
			const re = spectrum[2 * k];
			const im = spectrum[2 * k + 1];
			const mag = Math.sqrt(re * re + im * im);

			const diff = mag - prevMag[k];
			if (diff > 0) sum += diff;

			prevMag[k] = mag;
		}

		flux.push(sum);
	}

	// --- Post-processing ---
	const smoothed = smooth(flux, 3);
	const thresholded = adaptiveThreshold(smoothed, 16);

	// --- Peak picking ---
	const onsets: number[] = [];
	const minInterval = 0.05; // seconds

	for (let i = 1; i < thresholded.length - 1; i++) {
		if (
			thresholded[i] > thresholded[i - 1] &&
			thresholded[i] > thresholded[i + 1] &&
			thresholded[i] > 0
		) {
			const time = (i * hopSize) / sampleRate;
			if (onsets.length === 0 || time - onsets[onsets.length - 1] > minInterval) {
				onsets.push(time);
			}
		}
	}

	console.log(`Extracted onsets in ${new Date().getTime() - startTime.getTime()}ms`);

	return onsets;
}

function hann(n: number): Float32Array {
	const w = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		w[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
	}
	return w;
}

function smooth(data: number[], radius: number): number[] {
	return data.map((_, i) => {
		let sum = 0;
		let count = 0;
		for (let j = -radius; j <= radius; j++) {
			const idx = i + j;
			if (idx >= 0 && idx < data.length) {
				sum += data[idx];
				count++;
			}
		}
		return sum / count;
	});
}

function adaptiveThreshold(data: number[], windowSize: number): number[] {
	return data.map((v, i) => {
		let mean = 0;
		let count = 0;

		for (let j = -windowSize; j <= windowSize; j++) {
			const idx = i + j;
			if (idx >= 0 && idx < data.length) {
				mean += data[idx];
				count++;
			}
		}

		mean /= count;
		return v > mean ? v - mean : 0;
	});
}
