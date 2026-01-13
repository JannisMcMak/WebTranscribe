/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from './types';
import essentiajs from 'essentia.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
import type EssentiaModule from 'essentia.js/dist/core_api';

const essentia: EssentiaModule = new essentiajs.Essentia(EssentiaWASM);

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
	const msg = e.data;

	switch (msg.type) {
		case 'pitch': {
			console.log('Extracting pitch...');
			const res = essentia.PitchMelodia(essentia.arrayToVector(msg.buffer));
			self.postMessage({
				type: 'pitch',
				data: essentia.vectorToArray(res.pitch)
			} satisfies WorkerResponse);
			break;
		}

		case 'beat': {
			console.log('Extracting beats...');
			const res = essentia.BeatTrackerDegara(essentia.arrayToVector(msg.buffer));
			self.postMessage({
				type: 'beat',
				data: essentia.vectorToArray(res.ticks)
			} satisfies WorkerResponse);
			break;
		}
	}
};
