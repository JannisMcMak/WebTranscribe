import init from '../../rust/pkg/audio';

export async function initWasm() {
	await init();
}

export { foo } from '../../rust/pkg/audio';
