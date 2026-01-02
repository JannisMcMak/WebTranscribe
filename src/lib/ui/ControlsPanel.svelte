<script lang="ts">
	import audioEngine from '../engine/engine.svelte';
</script>

<button onclick={() => audioEngine.togglePlay()}>Play</button>

<button onclick={() => audioEngine.stop()}>Stop</button>

<!-- <button onclick={() => (playbackState.rate = 1)}>Reset speed</button> -->

<!-- <label>
	Speed
	<input type="range" min="0.25" max="2" step="0.05" bind:value={playbackState.rate} />
</label> -->

<label>
	Volume
	<input type="range" min="0" max="2" step="0.01" bind:value={audioEngine.volume} />
</label>
