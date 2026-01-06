<script lang="ts">
	import './app.css';
	import { onMount } from 'svelte';
	import Waveform from '$lib/ui/Waveform.svelte';
	import PitchPanel from '$lib/ui/PitchPanel.svelte';
	import BeatsOverlay from '$lib/ui/BeatsOverlay.svelte';
	import ControlsPanel from '$lib/ui/ControlsPanel.svelte';
	import { analysisState } from '$lib/stores.svelte';
	import createAnalysisWorker from '$lib/workers';
	import { initWasm, foo } from '$lib/wasm';
	import audioEngine from '$lib/engine/engine.svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { ModeWatcher } from 'mode-watcher';
	import KeyboardShortcuts from '$lib/ui/KeyboardShortcuts.svelte';
	import Footer from '$lib/ui/Footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import Upload from '@lucide/svelte/icons/upload';
	import { innerHeight } from 'svelte/reactivity/window';
	import VolumeMeter from '$lib/ui/VolumeMeter.svelte';

	onMount(async () => {
		await initWasm();
		const fooResult = foo(new Float32Array([1, 2, 3]));
		if (fooResult === 3) console.log('WASM works');

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

	let controlsPanel = $state<HTMLDivElement | null>(null);
	let footer = $state<HTMLDivElement | null>(null);
</script>

<ModeWatcher />
<KeyboardShortcuts />
<Tooltip.Provider delayDuration={400}>
	<main class="relative flex h-screen w-screen flex-col justify-between bg-accent">
		<ControlsPanel bind:ref={controlsPanel} />

		{#if audioEngine.blob}
			<div style={`top: ${controlsPanel?.clientHeight || 0}px;`} class="absolute left-0">
				<VolumeMeter
					h={(innerHeight.current || 0) -
						(controlsPanel?.clientHeight || 0) -
						(footer?.clientHeight || 0)}
				/>
			</div>
			<div class="m-12">
				<Waveform><BeatsOverlay /></Waveform>
			</div>
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center space-y-2">
				<div class="font-bold text-muted-foreground">No audio loaded</div>
				<Button>
					<Upload />
					Upload File
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onclick={() => {
						fetch('/sample.mp3')
							.then((response) => response.blob())
							.then((blob) => audioEngine.loadAudio(blob));
					}}>Load Sample</Button
				>
			</div>
		{/if}

		<PitchPanel />

		<Footer bind:ref={footer} />
	</main>
</Tooltip.Provider>
