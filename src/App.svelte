<script lang="ts">
	import './app.css';
	import { onMount } from 'svelte';
	import Waveform from '$lib/ui/Waveform.svelte';
	import PitchPanel from '$lib/ui/PitchPanel.svelte';
	import BeatsOverlay from '$lib/ui/BeatsPanel.svelte';
	import ControlsPanel from '$lib/ui/ControlsPanel.svelte';
	import { analysisState } from '$lib/stores.svelte';
	import createAnalysisWorker from '$lib/workers';
	import audioEngine from '$lib/engine/engine.svelte';
	import * as Card from '$lib/components/ui/card';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Resizable from '$lib/components/ui/resizable';
	import { ModeWatcher } from 'mode-watcher';
	import KeyboardShortcuts from '$lib/ui/KeyboardShortcuts.svelte';
	import Footer from '$lib/ui/Footer.svelte';
	import { Button } from '$lib/components/ui/button';
	import Upload from '@lucide/svelte/icons/upload';
	import Activity from '@lucide/svelte/icons/activity';
	import Music2 from '@lucide/svelte/icons/music-2';
	import { innerHeight, innerWidth } from 'svelte/reactivity/window';
	import VolumeMeter from '$lib/ui/VolumeMeter.svelte';
	import { Spinner } from '$lib/components/ui/spinner';
	import { TW_SPACING } from '$lib/utils';
	import { openDB } from 'idb';

	let audioWorker: ReturnType<typeof createAnalysisWorker> | null = null;

	const ANALYSIS_STORE = 'analysis';
	async function getDB() {
		return await openDB(sanitizedAudioName, 1, {
			upgrade(db) {
				db.createObjectStore(ANALYSIS_STORE);
			}
		});
	}
	async function persistAnalysisData<T extends 'pitch' | 'beat'>(
		analysisType: T,
		data: (typeof analysisState)[T]
	) {
		if (!audioEngine.blob || !currentAudioName) return;
		const db = await getDB();
		const existingData = (await db.get(ANALYSIS_STORE, analysisType)) || {};
		await db.put(ANALYSIS_STORE, { ...existingData, ...data }, analysisType);
	}
	async function getAnalysisData<T extends 'pitch' | 'beat'>(
		analysisType: T
	): Promise<(typeof analysisState)[T]> {
		const currentData = analysisState[analysisType];
		if (!audioEngine.blob || !currentAudioName) return currentData;
		const db = await getDB();
		const existingData = await db.get(ANALYSIS_STORE, analysisType);
		if (!existingData) return currentData;
		console.log('Found persisted analysis data for', analysisType);
		return existingData;
	}

	onMount(async () => {
		audioWorker = createAnalysisWorker();
		audioWorker.onMessage((msg) => {
			switch (msg.type) {
				case 'pitch':
					analysisState.pitch = {
						values: msg.pitches,
						offsets: msg.offsets,
						perFrame: msg.pitchesPerFrame,
						loading: false
					};
					persistAnalysisData('pitch', $state.snapshot(analysisState.pitch));
					break;
				case 'beat':
					analysisState.beat = {
						values: msg.data,
						firstBeatIndex: analysisState.beat.firstBeatIndex,
						beatsPerBar: analysisState.beat.beatsPerBar,
						loading: false
					};
					persistAnalysisData('beat', $state.snapshot(analysisState.beat));
					break;
			}
		});
		console.log('Created audio worker');
	});

	const loadAudio = async (b: Blob) => {
		await audioEngine.loadAudio(b);
		// Try to load analysis data from local storage
		analysisState.beat = await getAnalysisData('beat');
		analysisState.pitch = await getAnalysisData('pitch');
	};
	const doPitchAnalysis = () => {
		analysisState.pitch.loading = true;
		audioWorker?.post({
			type: 'pitch',
			buffer: audioEngine.audioData
		});
	};
	const doBeatsAnalysis = () => {
		analysisState.beat.loading = true;
		audioWorker?.post({
			type: 'beat',
			buffer: audioEngine.audioData
		});
	};

	let currentAudioName = $state('');
	let sanitizedAudioName = $derived(currentAudioName.toLowerCase().replaceAll(' ', '-'));

	let layout: number[] = $state([]);
	let beatsPane: Resizable.Pane | null = $state(null);

	let showVolumeMeter = $state(true);
	let showBeatsOverlay = $state(true);
	let showPitchOverlay = $state(true);

	let controlsPanel = $state<HTMLDivElement | null>(null);
	let footer = $state<HTMLDivElement | null>(null);
	let fileInput = $state<HTMLInputElement | null>(null);

	// Helpers
	const clientWidth = $derived(innerWidth.current || 0);
	const clientHeight = $derived(innerHeight.current || 0);
	const controlPanelHeight = $derived(controlsPanel?.clientHeight || 0);
	const footerHeight = $derived(footer?.clientHeight || 0);
	const workingAreaHeight = $derived(clientHeight - controlPanelHeight - footerHeight || 0);
</script>

<svelte:head>
	<title>WebTranscribe {currentAudioName ? `| ${currentAudioName}` : ''}</title>
</svelte:head>

<ModeWatcher />
<KeyboardShortcuts />
<Tooltip.Provider delayDuration={400}>
	<div class="relative flex h-screen w-screen bg-accent">
		<ControlsPanel
			class="absolute top-0 left-0 z-40"
			bind:ref={controlsPanel}
			bind:showVolumeMeter
			bind:showBeatsOverlay
			bind:showPitchOverlay
		/>

		<main
			class="relative flex w-full items-center justify-center"
			style="height: {workingAreaHeight}px; translate: 0 {controlPanelHeight}px"
		>
			{#if audioEngine.blob}
				{#if showVolumeMeter}
					<div class="absolute top-1/2 left-0 -translate-y-1/2">
						<VolumeMeter h={workingAreaHeight - 2 * TW_SPACING * 6} />
					</div>
				{/if}
				<Resizable.PaneGroup
					onLayoutChange={(l) => {
						layout = l;
					}}
					direction="vertical"
					class="px-12 py-6"
				>
					<Resizable.Pane minSize={20} order={1}>
						<Waveform
							w={clientWidth - 2 * 12 * TW_SPACING}
							h={(layout[0] / 100) * workingAreaHeight - TW_SPACING * 6}
						></Waveform>
					</Resizable.Pane>

					{#if showBeatsOverlay}
						<Resizable.Handle class="bg-accent" withHandle />
						<Resizable.Pane
							defaultSize={10}
							minSize={10}
							maxSize={20}
							order={2}
							bind:this={beatsPane}
						>
							<Card.Root class="flex h-full w-full items-center justify-center py-0 shadow-none">
								{#if !!analysisState.beat.values.length}
									<BeatsOverlay
										w={clientWidth - 2 * 16 * TW_SPACING}
										h={(beatsPane?.getSize() / 100) * workingAreaHeight - TW_SPACING * 6}
									/>
								{:else if analysisState.beat.loading}
									<Spinner />
								{:else}
									<Button onclick={doBeatsAnalysis}>
										<Activity />
										Analyze Beats
									</Button>
								{/if}
							</Card.Root>
						</Resizable.Pane>
					{/if}

					{#if showPitchOverlay}
						<Resizable.Handle class="bg-accent" withHandle />
						<Resizable.Pane defaultSize={50} minSize={15} order={3}>
							<Card.Root class="flex h-full w-full items-center justify-center shadow-none">
								{#if !!analysisState.pitch.values.length}
									<PitchPanel
										w={clientWidth - 2 * 12 * TW_SPACING}
										h={(layout[1] / 100) * workingAreaHeight - TW_SPACING * 6}
									/>
								{:else if analysisState.pitch.loading}
									<Spinner />
								{:else}
									<Button onclick={doPitchAnalysis}>
										<Music2 />
										Estimate Pitches
									</Button>
								{/if}
							</Card.Root>
						</Resizable.Pane>
					{/if}
				</Resizable.PaneGroup>
			{:else}
				<div class="flex h-full w-full flex-col items-center justify-center space-y-2">
					<input
						class="hidden"
						type="file"
						accept="audio/*"
						bind:this={fileInput}
						onchange={() => {
							if (!fileInput?.files) return;
							loadAudio(fileInput.files[0]);
							currentAudioName = fileInput.files[0].name;
						}}
					/>
					<Button onclick={() => fileInput?.click()}>
						<Upload />
						Load File
					</Button>
					<Button
						size="sm"
						variant="ghost"
						onclick={() => {
							fetch('/sample.mp3')
								.then((response) => response.blob())
								.then((b) => {
									loadAudio(b);
									currentAudioName = 'Sample';
								});
						}}>Load Sample</Button
					>
				</div>
			{/if}
		</main>

		<Footer class="absolute bottom-0 left-0 z-40" bind:ref={footer} />
	</div>
</Tooltip.Provider>
