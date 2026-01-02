<script lang="ts">
	import { onMount } from 'svelte';
	import Waveform from '@/lib/ui/Waveform.svelte';
	import PitchPanel from '@/lib/ui/PitchPanel.svelte';
	import BeatsOverlay from '@/lib/ui/BeatsOverlay.svelte';
	import { analysisState, audioState } from '@/lib/stores.svelte';
	import createAnalysisWorker from '@/lib/workers';

	onMount(() => {
		fetch('/test.mp3')
			.then((response) => response.blob())
			.then(async (blob) => {
				audioState.blob = blob;

				const audioWorker = createAnalysisWorker();
				audioWorker.onMessage((msg) => {
					switch (msg.type) {
						case 'pitch':
							analysisState.pitchTrack = msg.data;
							break;
						case 'onset':
							analysisState.beats = msg.data;
							break;
					}
				});
				console.log('Created audio worker');

				while (!audioState.buffer) {
					// Wait for the audio buffer to be loaded
					await new Promise((resolve) => setTimeout(resolve, 100));
				}
				console.log('Registered audio buffer');

				// Do analysis
				audioWorker.post({
					type: 'pitch',
					buffer: audioState.buffer.getChannelData(0),
					sampleRate: audioState.sampleRate
				});
				audioWorker.post({
					type: 'onset',
					buffer: audioState.buffer.getChannelData(0),
					sampleRate: audioState.sampleRate
				});
			});
	});
</script>

<Waveform>
	<BeatsOverlay />
</Waveform>
<PitchPanel />
