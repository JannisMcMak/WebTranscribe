export type WorkerRequest =
	| {
			type: 'pitch';
			buffer: Float32Array;
	  }
	| {
			type: 'beat';
			buffer: Float32Array;
	  };

export type WorkerResponse =
	| {
			type: 'pitch';
			pitches: Float32Array; // pitches
			pitchesPerFrame: Int32Array; // number of pitches for each frame
			offsets: Int32Array; // number of pitches that need to be skipped for each frame
	  }
	| {
			type: 'beat';
			data: Float32Array; // onset times
	  };
