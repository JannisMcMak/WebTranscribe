<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Card from '$lib/components/ui/card';
	import * as Item from '$lib/components/ui/item';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import SquareIcon from '@lucide/svelte/icons/square';
	import RepeatIcon from '@lucide/svelte/icons/repeat';
	import ScanSearch from '@lucide/svelte/icons/scan-search';
	import UnfoldHorizontal from '@lucide/svelte/icons/unfold-horizontal';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import { Button } from '$lib/components/ui/button';
	import audioEngine, { playbackRateParam, volumeParam } from '$lib/engine/engine.svelte';
	import ThemeButton from '$lib/components/ThemeButton.svelte';
	import { formatTime } from '$lib/utils';
	import { Slider } from '$lib/components/ui/slider';
	import { waveformState } from '$lib/stores.svelte';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
	import { Toggle } from '$lib/components/ui/toggle';
	import type { ItemSize, ItemVariant } from '$lib/components/ui/item/item.svelte';

	let {
		ref = $bindable(null)
	}: {
		ref?: HTMLDivElement | null;
	} = $props();

	const variant: ItemVariant = 'outline';
	const size: ItemSize = 'sm';
</script>

<Card.Root class="h-auto w-full p-4" bind:ref>
	<Card.Content class="flex w-full flex-wrap gap-4 p-0">
		<!-- Timing panel -->
		<Item.Root {size} {variant} class="font-mono">
			<div class="text-3xl font-bold">
				{formatTime(audioEngine.bufferPosition)}
			</div>
			<div class="ml-2 flex flex-col text-sm text-muted-foreground">
				<span>{formatTime(waveformState.hoverPosition)}</span>
				<span>{formatTime(audioEngine.bufferDuration)}</span>
			</div>
		</Item.Root>

		<!-- Playback controls -->
		<Item.Root {size} {variant}>
			<Item.Content>
				<Item.Title>Playback</Item.Title>
				<Item.Description>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<PlayButton
								isPlaying={audioEngine.playing}
								onClick={() => audioEngine.togglePlay()}
							/>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							{audioEngine.playing ? 'Pause' : 'Play'}
							<KbdGroup>
								<Kbd>Space</Kbd>/
								<Kbd>K</Kbd>
							</KbdGroup>
						</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline" size="icon" onclick={() => audioEngine.stop()}>
								<SquareIcon />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">Stop <Kbd>Esc</Kbd></Tooltip.Content>
					</Tooltip.Root>
				</Item.Description>
			</Item.Content>
		</Item.Root>

		<!-- Loop -->
		<Item.Root {size} {variant}>
			<Item.Content>
				<Item.Title>Loop</Item.Title>
				<Item.ItemDescription>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Toggle
								variant="outline"
								disabled={!audioEngine.playbackLoopMarkers}
								pressed={audioEngine.enableLooping || !audioEngine.playbackLoopMarkers}
								onPressedChange={() => audioEngine.toggleLooping()}
							>
								<RepeatIcon />
							</Toggle>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							Toggle Loop
							<Kbd>T</Kbd>
						</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								size="icon"
								variant="outline"
								disabled={!audioEngine.playbackLoopMarkers}
								onclick={() => audioEngine.clearLoop()}
							>
								<TrashIcon />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							Clear loop region
							<Kbd>C</Kbd>
						</Tooltip.Content>
					</Tooltip.Root>
				</Item.ItemDescription>
			</Item.Content>
			<div class="ml-2 flex flex-col items-end font-mono text-sm text-muted-foreground">
				<span>
					{formatTime(audioEngine.playbackLoopMarkers?.start)}
				</span>
				<span>{formatTime(audioEngine.playbackLoopMarkers?.end)}</span>
			</div>
		</Item.Root>

		<!-- Playback speed -->
		<!-- TODO block/(btn-icon)-sized slider with value label inside -->
		<Item.Root {size} {variant}>
			<Item.Content class="justify-betwen flex h-full flex-col">
				<Item.Title>
					Playback Speed
					<span>{audioEngine.playbackSpeed.toFixed(2)}x</span>
				</Item.Title>
				<div class="flex items-center">
					<Slider
						type="single"
						class="mb-1 min-w-48"
						value={audioEngine.playbackSpeed}
						onValueCommit={(x) => audioEngine.setPlaybackSpeed(x)}
						{...playbackRateParam.sliderAttributes}
					/>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button size="sm" variant="ghost" onclick={() => audioEngine.setPlaybackSpeed(1)}>
								Reset
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">
							Reset playback speed
							<Kbd>R</Kbd>
						</Tooltip.Content>
					</Tooltip.Root>
				</div>
			</Item.Content>
		</Item.Root>

		<!-- Volume -->
		<Item.Root {size} {variant}>
			<Item.Content>
				<Item.Title>
					Volume
					<span>{Math.round(audioEngine.volume * 100)}%</span>
				</Item.Title>
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Slider
							type="single"
							class="mb-1 min-w-48 "
							bind:value={audioEngine.volume}
							{...volumeParam.sliderAttributes}
						/>
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">
						Volume
						<KbdGroup>
							<Kbd>&uparrow;</Kbd>/
							<Kbd>&downarrow;</Kbd>
						</KbdGroup>
					</Tooltip.Content>
				</Tooltip.Root>
			</Item.Content>
		</Item.Root>

		<!-- View -->
		<Item.Root {size} {variant}>
			<Item.Content>
				<Item.Title>View</Item.Title>
				<Item.Description>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button
								variant="outline"
								size="icon"
								onclick={() => waveformState.centerToPlayhead()}
							>
								<UnfoldHorizontal />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">Center to Playhead</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<Button variant="outline" size="icon" onclick={() => waveformState.resetZoom()}>
								<ScanSearch />
							</Button>
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">Reset Zoom</Tooltip.Content>
					</Tooltip.Root>
					<Tooltip.Root>
						<Tooltip.Trigger>
							<ThemeButton />
						</Tooltip.Trigger>
						<Tooltip.Content side="bottom">Toggle theme</Tooltip.Content>
					</Tooltip.Root>
				</Item.Description>
			</Item.Content>
		</Item.Root>
	</Card.Content>
</Card.Root>
