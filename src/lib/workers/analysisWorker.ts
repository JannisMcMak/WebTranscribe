/// <reference lib="webworker" />

import extractPitch from '$lib/audio/pitch';
import extractOnset from '$lib/audio/onset';
import type { WorkerRequest, WorkerResponse } from './types';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
	const msg = e.data;

	switch (msg.type) {
		case 'pitch': {
			const frames = extractPitch(msg.buffer, msg.sampleRate);
			const res: WorkerResponse = { type: 'pitch', data: frames };
			self.postMessage(res);
			break;
		}

		case 'onset': {
			const onset = extractOnset(msg.buffer, msg.sampleRate);
			self.postMessage({ type: 'onset', data: onset });
			break;
		}
	}
};
