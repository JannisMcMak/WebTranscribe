/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from './types';
import essentiajs from 'essentia.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
import type EssentiaModule from 'essentia.js/dist/core_api';

const essentia = new essentiajs.Essentia(EssentiaWASM) as EssentiaModule;

interface VectorReal {
	size(): number;
	get(i: number): number;
}
interface VectorVectorReal {
	size(): number;
	get(i: number): VectorReal;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
	const msg = e.data;

	switch (msg.type) {
		case 'pitch': {
			const startTime = new Date();
			console.log('Extracting pitch...');
			const res = essentia.MultiPitchMelodia(essentia.arrayToVector(msg.buffer));
			console.log(
				'Pitch extraction finished in',
				new Date().getTime() - startTime.getTime() + 'ms'
			);

			// MultiPitchMelodia returns a VectorVectorReal, with multiple pitch values per frame.
			const resultMatrix = res.pitch as VectorVectorReal;
			const numFrames = resultMatrix.size();
			let totalPitchValues = 0;
			for (let i = 0; i < numFrames; i++) {
				const frame = resultMatrix.get(i);
				for (let j = 0; j < frame.size(); j++) {
					if (frame.get(j) > 0) totalPitchValues++;
				}
			}

			// Store all pitch values in the matrix as a flattened 1D array.
			// Keep track of the number of pitch values per frame.
			// Also maintain a list of offsets for each frame so that we can use it later to find the start of each frame.
			const pitches = new Float32Array(totalPitchValues);
			const pitchesPerFrame = new Int32Array(numFrames);
			let offset = 0;
			const offsets = new Int32Array(numFrames);
			for (let i = 0; i < numFrames; i++) {
				const frame = resultMatrix.get(i);
				let numPitches = 0;

				for (let j = 0; j < frame.size(); j++) {
					const pitch = frame.get(j);
					if (pitch > 0) {
						pitches[offset + j] = pitch;
						numPitches++;
					}
				}

				pitchesPerFrame[i] = numPitches;
				offsets[i] = offset;
				offset += numPitches;
			}

			self.postMessage({
				type: 'pitch',
				pitches: pitches,
				pitchesPerFrame: pitchesPerFrame,
				offsets: offsets
			} satisfies WorkerResponse);
			break;
		}

		case 'beat': {
			const startTime = new Date();
			console.log('Extracting beats...');
			const res = essentia.RhythmExtractor2013(essentia.arrayToVector(msg.buffer));
			console.log(
				'Beats extraction finished in',
				new Date().getTime() - startTime.getTime() + 'ms'
			);
			self.postMessage({
				type: 'beat',
				data: essentia.vectorToArray(res.ticks)
			} satisfies WorkerResponse);
			break;
		}
	}
};
