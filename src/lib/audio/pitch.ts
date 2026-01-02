import PitchFinder from 'pitchfinder';
import type { PitchFrame } from '@/lib/types';

export default function extractPitch(
	data: Float32Array,
	sampleRate: number,
	hopSize = 512,
	chunkSize = 2048
): PitchFrame[] {
	const startTime = new Date();

	const detectPitch = PitchFinder.YIN();

	const frames: PitchFrame[] = [];

	for (let i = 0; i < data.length; i += hopSize) {
		const frame = data.subarray(i, i + chunkSize);
		const freq = detectPitch(frame);
		frames.push({
			time: i / sampleRate,
			freq,
			confidence: freq ? 1 : 0
		});
	}

	console.log(`Extracted pitch in ${new Date().getTime() - startTime.getTime()}ms`);

	return frames;
}
