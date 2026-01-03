<script lang="ts">
	import audioEngine from '$lib/engine/engine.svelte';

	const playbackRateOptions = [0.25, 0.5, 0.75, 1, 1.25];
</script>

<button onclick={() => audioEngine.togglePlay()}>Play</button>

<button onclick={() => audioEngine.stop()}>Stop</button>

{#each playbackRateOptions as rate}
	<button
		onclick={() => audioEngine.setPlaybackSpeed(rate)}
		disabled={audioEngine.playbackSpeed === rate}
	>
		{rate}x
	</button>
{/each}

<label>
	Volume
	<input type="range" min="0" max="2" step="0.01" bind:value={audioEngine.volume} />
</label>
