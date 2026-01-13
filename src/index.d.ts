declare module 'essentia.js' {
	export class Essentia {
		constructor(wasm: object);
	}
}

declare module 'essentia.js/dist/essentia-wasm.es.js' {
	const EssentiaWASM: object;
}
