import type { PitchFrame } from '@/lib/types';

export type WorkerRequest =
	| {
			type: 'pitch';
			buffer: Float32Array;
			sampleRate: number;
	  }
	| {
			type: 'onset';
			buffer: Float32Array;
			sampleRate: number;
	  };

export type WorkerResponse =
	| {
			type: 'pitch';
			data: PitchFrame[];
	  }
	| {
			type: 'onset';
			data: number[]; // onset times
	  };
