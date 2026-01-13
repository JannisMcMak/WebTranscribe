/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from './types';
import essentiajs from 'essentia.js';
import { EssentiaWASM } from 'essentia.js/dist/essentia-wasm.es.js';
import type EssentiaModule from 'essentia.js/dist/core_api';

const essentia = new essentiajs.Essentia(EssentiaWASM) as EssentiaModule;

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
	const msg = e.data;

	switch (msg.type) {
		case 'pitch': {
			const startTime = new Date();
			console.log('Extracting pitch...');
			const res = essentia.PitchMelodia(essentia.arrayToVector(msg.buffer));
			console.log(
				'Pitch extraction finished in',
				new Date().getTime() - startTime.getTime() + 'ms'
			);
			self.postMessage({
				type: 'pitch',
				data: essentia.vectorToArray(res.pitch)
			} satisfies WorkerResponse);
			break;
		}

		case 'beat': {
			const startTime = new Date();
			console.log('Extracting beats...');
			const res = essentia.BeatTrackerDegara(essentia.arrayToVector(msg.buffer));
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
