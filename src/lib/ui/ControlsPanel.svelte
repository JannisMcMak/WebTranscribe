<script lang="ts">
	import * as Tooltip from '$lib/components/ui/tooltip';
	import * as Card from '$lib/components/ui/card';
	import PlayButton from '$lib/components/PlayButton.svelte';
	import SquareIcon from '@lucide/svelte/icons/square';
	import RepeatIcon from '@lucide/svelte/icons/repeat';
	import ScanSearch from '@lucide/svelte/icons/scan-search';
	import UnfoldHorizontal from '@lucide/svelte/icons/unfold-horizontal';
	import { Button } from '$lib/components/ui/button';
	import audioEngine, { playbackRateParam, volumeParam } from '$lib/engine/engine.svelte';
	import ThemeButton from '$lib/components/ThemeButton.svelte';
	import { formatTime } from '$lib/utils';
	import { Slider } from '$lib/components/ui/slider';
	import { waveformState } from '$lib/stores.svelte';
	import { Kbd, KbdGroup } from '$lib/components/ui/kbd';
</script>

<Card.Root class="h-auto w-full p-4">
	<Card.Content class="flex w-full space-x-12 p-0">
		<!-- Timing panel -->
		<Card.Root class="flex-row items-center gap-4 p-3 font-mono">
			<div class="text-3xl font-bold">
				{formatTime(audioEngine.bufferPosition)}
			</div>
			<div class="flex flex-col text-sm text-muted-foreground">
				<span>{formatTime(waveformState.hoverPosition)}</span>
				<span>{formatTime(audioEngine.bufferDuration)}</span>
			</div>
		</Card.Root>

		<!-- Playback controls -->
		<div class="flex flex-col justify-between">
			<div class="text-sm font-bold">Playback Controls</div>
			<div class="flex space-x-2">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<PlayButton isPlaying={audioEngine.playing} onClick={() => audioEngine.togglePlay()} />
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

				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="icon">
							<RepeatIcon />
						</Button>
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">
						Toggle Loop
						<Kbd>T</Kbd>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>

		<!-- Playback speed -->
		<div class="flex flex-col justify-between">
			<div class="text-sm font-bold">Playback Speed</div>
			<div class="flex items-end">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Slider
							type="single"
							class="mb-1 min-w-48"
							value={audioEngine.playbackSpeed}
							onValueCommit={(x) => audioEngine.setPlaybackSpeed(x)}
							valueFormatter={(value) => `${value.toFixed(2)}x`}
							{...playbackRateParam.sliderAttributes}
						/>
					</Tooltip.Trigger>
					<Tooltip.Content side="bottom">
						Playback speed
						<KbdGroup>
							<Kbd>Shift</Kbd>+<Kbd>&uparrow;</Kbd>
							/
							<Kbd>Shift</Kbd>+<Kbd>&downarrow;</Kbd>
						</KbdGroup>
					</Tooltip.Content>
				</Tooltip.Root>
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
		</div>

		<!-- Volume -->
		<div class="flex flex-col justify-between">
			<div class="text-sm font-bold">Volume</div>
			<Tooltip.Root>
				<Tooltip.Trigger>
					<Slider
						type="single"
						class="mb-1 min-w-48 "
						bind:value={audioEngine.volume}
						valueFormatter={(value) => `${Math.round(value * 100)}%`}
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
		</div>

		<!-- View -->
		<div class="flex flex-col justify-between">
			<div class="text-sm font-bold">View</div>
			<div class="flex space-x-2">
				<Tooltip.Root>
					<Tooltip.Trigger>
						<Button variant="outline" size="icon" onclick={() => waveformState.centerToPlayhead()}>
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
			</div>
		</div>
	</Card.Content>
</Card.Root>
