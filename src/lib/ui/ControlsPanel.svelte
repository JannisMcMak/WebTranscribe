<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as ButtonGroup from '$lib/components/ui/button-group';
	import * as Card from '$lib/components/ui/card';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import SquareIcon from '@lucide/svelte/icons/square';
	import { Button } from '$lib/components/ui/button';
	import audioEngine from '$lib/engine/engine.svelte';
	import ThemeButton from '$lib/components/ThemeButton.svelte';
	import { cn } from '$lib/utils';
	import { Slider } from '$lib/components/ui/slider';

	const playbackRateOptions = [0.25, 0.5, 0.75, 1, 1.25];
</script>

<Card.Root class="h-auto w-full gap-0">
	<Card.Header class="grid-cols-[auto_1fr] gap-x-6">
		<Card.Title>WebTranscribe</Card.Title>
		<Card.Description class="text-right">
			Web utility for transcribing music.
			<Button
				variant="link"
				size="sm"
				class="text-sm text-muted-foreground!"
				href="https://github.com/JannisMcMak/WebTranscribe"
				target="_blank"
			>
				View on GitHub
			</Button>
		</Card.Description>
	</Card.Header>

	<Card.Content class="flex w-full items-center space-x-8">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<ButtonGroup.Root>
					<PlayButton isPlaying={audioEngine.playing} onClick={() => audioEngine.togglePlay()} />

					<Button variant="outline" size="icon" onclick={() => audioEngine.stop()}>
						<SquareIcon />
					</Button>
				</ButtonGroup.Root>
			</Tooltip.Trigger>
			<Tooltip.Content>Play/Stop</Tooltip.Content>
		</Tooltip.Root>

		<ButtonGroup.Root>
			{#each playbackRateOptions as rate}
				{@const isActive = audioEngine.playbackSpeed === rate}
				<Button
					variant={isActive ? 'default' : 'outline'}
					class={cn('text-sm', isActive ? 'pointer-events-none' : '')}
					onclick={() => audioEngine.setPlaybackSpeed(rate)}
				>
					{rate * 100}%
				</Button>
			{/each}
		</ButtonGroup.Root>

		<Slider
			type="single"
			bind:value={audioEngine.volume}
			min={0}
			max={2}
			step={0.01}
			class="max-w-40"
		/>

		<Tooltip.Root>
			<Tooltip.Trigger>
				<ThemeButton />
			</Tooltip.Trigger>
			<Tooltip.Content>Toggle theme</Tooltip.Content>
		</Tooltip.Root>
	</Card.Content>
</Card.Root>
