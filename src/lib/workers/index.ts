import type { WorkerRequest, WorkerResponse } from './types';

export default function createAnalysisWorker() {
	const worker = new Worker(new URL('./analysisWorker.ts', import.meta.url), { type: 'module' });

	return {
		worker,
		post(msg: WorkerRequest) {
			worker.postMessage(msg);
		},
		onMessage(cb: (msg: WorkerResponse) => void) {
			worker.onmessage = (e) => cb(e.data);
		},
		destroy() {
			worker.terminate();
		}
	};
}
