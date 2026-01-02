<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import Timeline from 'wavesurfer.js/dist/plugins/timeline.js';
	import { onMount, onDestroy } from 'svelte';
	import { audioState, playbackState } from '@/lib/stores.svelte';
	import audioUtils from '../audio/utilts';

	let container: HTMLDivElement;
	let ws: WaveSurfer;

	onMount(() => {
		ws = WaveSurfer.create({
			container,
			height: 120,
			waveColor: '#555',
			progressColor: '#fff',
			cursorColor: '#ff0',
			normalize: true,
			plugins: [Timeline.create({ container: '#timeline' })]
		});

		ws.on('timeupdate', (t) => (playbackState.currentTime = t));
		ws.on('play', () => (playbackState.isPlaying = true));
		ws.on('pause', () => (playbackState.isPlaying = false));

		$effect(() => {
			if (audioState.blob) {
				ws.loadBlob(audioState.blob);
			}
		});

		$effect(() => {
			if (playbackState.rate) {
				ws.setPlaybackRate(playbackState.rate);
			}
		});
	});

	onDestroy(() => ws?.destroy());
</script>

<button
	onclick={() => {
		ws.playPause();
	}}>Play</button
>

<button
	onclick={() => {
		playbackState.rate = 1;
	}}>Reset speed</button
>

<label>
	Speed
	<input type="range" min="0.25" max="2" step="0.05" bind:value={playbackState.rate} />
</label>

<div bind:this={container}></div>
<div id="timeline"></div>
