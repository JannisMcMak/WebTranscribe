import { createRubberBandNode, type RubberBandNode } from 'rubberband-web';

export default async function getPitchshiftNode(ctx: AudioContext): Promise<RubberBandNode> {
	try {
		const node = await createRubberBandNode(ctx, '/rubberband-processor.js');
		node.setHighQuality(true);
		return node;
	} catch (e) {
		console.warn('Failed to initialize Rubberband');
		throw e;
	}
}
