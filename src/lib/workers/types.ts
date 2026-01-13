export type WorkerRequest =
	| {
			type: 'pitch';
			buffer: Float32Array;
			sampleRate: number;
	  }
	| {
			type: 'beat';
			buffer: Float32Array;
			sampleRate: number;
	  };

export type WorkerResponse =
	| {
			type: 'pitch';
			data: Float32Array; // pitches
	  }
	| {
			type: 'beat';
			data: Float32Array; // onset times
	  };
