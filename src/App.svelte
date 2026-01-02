<script lang="ts">
	import { onMount } from 'svelte';
	import Waveform from '@/lib/ui/Waveform.svelte';
	import { audioState } from '@/lib/stores.svelte';

	onMount(() => {
		fetch('/test.mp3')
			.then((response) => response.blob())
			.then((blob) => (audioState.blob = blob));
	});
</script>

<Waveform />
