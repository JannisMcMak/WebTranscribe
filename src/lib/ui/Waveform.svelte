<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import Timeline from 'wavesurfer.js/dist/plugins/timeline.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import audioEngine from '$lib/engine/engine.svelte';

	interface Props {
		children?: Snippet;
	}
	let { children }: Props = $props();

	let container: HTMLDivElement;
	let ws: WaveSurfer;

	onMount(() => {
		ws = WaveSurfer.create({
			container,
			height: 240,
			waveColor: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground'),
			progressColor: getComputedStyle(document.documentElement).getPropertyValue(
				'--accent-foreground'
			),
			cursorColor: getComputedStyle(document.documentElement).getPropertyValue('--destructive'),
			normalize: true,
			plugins: [Timeline.create({ container: '#timeline' })],
			dragToSeek: true
		});

		// Load audio into WaveSurfer every time the blob in the audio engine changes
		$effect(() => {
			if (audioEngine.blob) {
				ws.loadBlob(audioEngine.blob);
			} else {
				ws.empty();
			}
		});

		// Sync the audio engine playback loop to the WaveSurfer time
		$effect(() => {
			// WaveSurfer needs the actual position in the original audio buffer (Buffer Time)
			ws.setTime(audioEngine.bufferPosition);
		});

		ws.on('interaction', (audioBufferTime) => {
			// Convert from audio buffer time to playback time
			const playbackTime = audioBufferTime / audioEngine.playbackSpeed;
			audioEngine.seekTo(playbackTime);
		});
	});

	onDestroy(() => ws?.destroy());
</script>

<div bind:this={container} class="relative">
	{#if children}
		{@render children()}
	{/if}
</div>
<div id="timeline"></div>
