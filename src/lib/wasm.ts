import init from '../../rust/pkg/audio';

export async function initWasm() {
	await init();
}

export { timestretch } from '../../rust/pkg/audio';
