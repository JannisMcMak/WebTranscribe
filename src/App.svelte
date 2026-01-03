<script lang="ts">
	import { onMount } from 'svelte';
	import Waveform from '@/lib/ui/Waveform.svelte';
	import PitchPanel from '@/lib/ui/PitchPanel.svelte';
	import BeatsOverlay from '@/lib/ui/BeatsOverlay.svelte';
	import ControlsPanel from '@/lib/ui/ControlsPanel.svelte';
	import { analysisState } from '@/lib/stores.svelte';
	import createAnalysisWorker from '@/lib/workers';
	import { initWasm } from '@/lib/wasm';
	import audioEngine from '@/lib/engine/engine.svelte';

	onMount(async () => {
		await initWasm();

		fetch('/test.mp3')
			.then((response) => response.blob())
			.then(async (blob) => {
				audioEngine.loadAudio(blob);

				// const audioWorker = createAnalysisWorker();
				// audioWorker.onMessage((msg) => {
				// 	switch (msg.type) {
				// 		case 'pitch':
				// 			analysisState.pitchTrack = msg.data;
				// 			break;
				// 		case 'onset':
				// 			analysisState.beats = msg.data;
				// 			break;
				// 	}
				// });
				// console.log('Created audio worker');

				// while (!audioState.buffer) {
				// 	// Wait for the audio buffer to be loaded
				// 	await new Promise((resolve) => setTimeout(resolve, 100));
				// }
				// console.log('Registered audio buffer');

				// // Do analysis
				// audioWorker.post({
				// 	type: 'pitch',
				// 	buffer: audioState.buffer.getChannelData(0),
				// 	sampleRate: audioState.sampleRate
				// });
				// audioWorker.post({
				// 	type: 'onset',
				// 	buffer: audioState.buffer.getChannelData(0),
				// 	sampleRate: audioState.sampleRate
				// });
			});
	});
</script>

<ControlsPanel />
<Waveform>
	<BeatsOverlay />
</Waveform>
<PitchPanel />

<button onclick={() => audioEngine.clearAudio()}>remove</button>
