<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import Timeline from 'wavesurfer.js/dist/plugins/timeline.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import audioEngine from '@/lib/engine/engine.svelte';

	interface Props {
		children?: Snippet;
	}
	let { children }: Props = $props();

	let container: HTMLDivElement;
	let ws: WaveSurfer;

	onMount(() => {
		ws = WaveSurfer.create({
			container,
			height: 120,
			waveColor: '#999 ',
			progressColor: '#0a5685',
			cursorColor: '#8c4fff',
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
			ws.setTime(audioEngine.playbackPosition);
		});

		ws.on('interaction', (t) => {
			audioEngine.seekTo(t);
		});
	});

	onDestroy(() => ws?.destroy());
</script>

<div bind:this={container} style="position: relative;">
	{#if children}
		{@render children()}
	{/if}
</div>
<div id="timeline"></div>
