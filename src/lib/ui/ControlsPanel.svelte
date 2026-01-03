<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button';
	import audioEngine from '$lib/engine/engine.svelte';
	import ThemeButton from '$lib/components/ThemeButton.svelte';

	const playbackRateOptions = [0.25, 0.5, 0.75, 1, 1.25];
</script>

<div class="w-full bg-background p-4">
	<Tooltip.Root>
		<Tooltip.Trigger>
			<PlayButton isPlaying={audioEngine.playing} onClick={() => audioEngine.togglePlay()} />
		</Tooltip.Trigger>
		<Tooltip.Content>Play</Tooltip.Content>
	</Tooltip.Root>

	<Tooltip.Root>
		<Tooltip.Trigger>
			<Button variant="outline" size="icon" onclick={() => audioEngine.stop()}>
				<SquareIcon />
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content>Stop</Tooltip.Content>
	</Tooltip.Root>

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

	<Tooltip.Root>
		<Tooltip.Trigger>
			<ThemeButton />
		</Tooltip.Trigger>
		<Tooltip.Content>Toggle theme</Tooltip.Content>
	</Tooltip.Root>
</div>
