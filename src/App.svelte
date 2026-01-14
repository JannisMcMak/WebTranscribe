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
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';
	import VolumeMeter from '$lib/ui/VolumeMeter.svelte';

	let audioWorker: ReturnType<typeof createAnalysisWorker> | null = null;

	onMount(async () => {
		await initWasm();
		const fooResult = foo(new Float32Array([1, 2, 3]));
		if (fooResult === 3) console.log('WASM works');

		audioWorker = createAnalysisWorker();
		audioWorker.onMessage((msg) => {
			switch (msg.type) {
				case 'pitch':
					analysisState.pitches = msg.data;
					break;
				case 'beat':
					analysisState.beats = msg.data;
					break;
			}
		});
		console.log('Created audio worker');
	});

	const loadAudio = async (b: Blob) => {
		await audioEngine.loadAudio(b);

		// Do analysis
		audioWorker?.post({
			type: 'beat',
			buffer: audioEngine.audioData
		});
		audioWorker?.post({
			type: 'pitch',
			buffer: audioEngine.audioData
		});
	};

	let showVolumeMeter = $state(true);
	let showBeatsOverlay = $state(false);
	let showPitchOverlay = $state(false);

	let controlsPanel = $state<HTMLDivElement | null>(null);
	let footer = $state<HTMLDivElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	// Helpers
	const twSpacing =
		parseFloat(getComputedStyle(document.documentElement).fontSize) *
		parseFloat(
			getComputedStyle(document.documentElement).getPropertyValue('--spacing').replace('rem', '')
		);
	const clientWidth = $derived(innerWidth.current || 0);
	const clientHeight = $derived(innerHeight.current || 0);
	const controlPanelHeight = $derived(controlsPanel?.clientHeight || 0);
	const footerHeight = $derived(footer?.clientHeight || 0);
</script>

<ModeWatcher />
<KeyboardShortcuts />
<Tooltip.Provider delayDuration={400}>
	<main class="relative flex h-screen w-screen flex-col justify-between bg-accent">
		<ControlsPanel
			bind:ref={controlsPanel}
			bind:showVolumeMeter
			bind:showBeatsOverlay
			bind:showPitchOverlay
		/>

		{#if audioEngine.blob}
			{#if showVolumeMeter}
				<div style={`top: ${controlPanelHeight}px;`} class="absolute left-0">
					<VolumeMeter h={clientHeight - controlPanelHeight - footerHeight} />
				</div>
			{/if}
			<div class="overflow-y-auto px-12">
				<Waveform>
					{#if showBeatsOverlay}
						<BeatsOverlay />
					{/if}
				</Waveform>
				{#if showPitchOverlay}
					<PitchPanel w={clientWidth - 2 * 12 * twSpacing} />
				{/if}
			</div>
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center space-y-2">
				<div class="font-bold text-muted-foreground">No audio loaded</div>
				<input
					class="hidden"
					type="file"
					accept="audio/*"
					bind:this={fileInput}
					onchange={() => {
						if (!fileInput?.files) return;
						loadAudio(fileInput.files[0]);
					}}
				/>
				<Button onclick={() => fileInput?.click()}>
					<Upload />
					Upload File
				</Button>
				<Button
					size="sm"
					variant="ghost"
					onclick={() => {
						fetch('/sample.mp3')
							.then((response) => response.blob())
							.then(loadAudio);
					}}>Load Sample</Button
				>
			</div>
		{/if}

		<Footer bind:ref={footer} />
	</main>
</Tooltip.Provider>
