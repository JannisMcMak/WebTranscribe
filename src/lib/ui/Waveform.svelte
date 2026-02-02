<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import Timeline from 'wavesurfer.js/dist/plugins/timeline.js';
	import Region from 'wavesurfer.js/dist/plugins/regions.js';
	import Hover from 'wavesurfer.js/dist/plugins/hover.js';
	import Zoom from 'wavesurfer.js/dist/plugins/zoom.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { waveformState } from '$lib/stores.svelte';
	import { formatTime, TW_SPACING } from '$lib/utils';
	import { Spinner } from '$lib/components/ui/spinner';
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import ScanSearch from '@lucide/svelte/icons/scan-search';
	import UnfoldHorizontal from '@lucide/svelte/icons/unfold-horizontal';

	interface Props {
		w: number;
		h: number;
	}
	let { w, h }: Props = $props();

	let container: HTMLDivElement;
	let ws: WaveSurfer;

	onMount(() => {
		const hoverPlugin = Hover.create({ labelSize: 0 });
		const zoomPlugin = Zoom.create();
		const regionPlugin = Region.create();
		const timelinePlugin = Timeline.create({
			insertPosition: 'beforebegin',
			formatTimeCallback: (s) => formatTime(s, true)
		});
		ws = WaveSurfer.create({
			container,
			height: h - TW_SPACING * 4, // Allow space for scrollbar
			waveColor: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground'),
			progressColor: getComputedStyle(document.documentElement).getPropertyValue(
				'--accent-foreground'
			),
			cursorColor: getComputedStyle(document.documentElement).getPropertyValue('--destructive'),
			plugins: [timelinePlugin, hoverPlugin, zoomPlugin, regionPlugin]
		});

		// --- Sync to/from custom audio engine ---

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

		// Seek on click / drag
		ws.on('interaction', (audioBufferTime) => {
			// Convert from audio buffer time to playback time
			const playbackTime = audioBufferTime / audioEngine.playbackSpeed;
			audioEngine.seekTo(playbackTime);
		});

		// --- Sync state variables to global waveform store ---

		// Hover position
		hoverPlugin.on(
			'hover',
			(relX) => (waveformState.hoverPosition = relX * audioEngine.bufferDuration)
		);
		container.addEventListener('mouseleave', () => (waveformState.hoverPosition = 0));
		// Zoom level
		ws.on('zoom', () => (waveformState.zoom = getZoomLevel()));
		// Scroll position
		ws.on('scroll', () => {
			waveformState.scrollPosition =
				(ws.getScroll() / ws.getWrapper().scrollWidth) * audioEngine.bufferDuration;
		});
		// Add scroll handler
		waveformState.handleScroll = (e: WheelEvent) => {
			if (!ws || Math.abs(e.deltaY) >= Math.abs(e.deltaX)) return;
			const delta = e.deltaX;
			const scrollPos = ws.getScroll();
			ws.setScroll(scrollPos + delta);
		};

		// --- Regions ---

		// Enable regions by dragging
		regionPlugin.enableDragSelection({
			color: '#e7000b30',
			minLength: 1
		});
		regionPlugin.on('region-created', (region) => {
			// Allow the user to select loop region
			audioEngine.setLoop(region.start, region.end);
			// Remove all other regions
			regionPlugin
				.getRegions()
				.filter((r) => r.id !== region.id)
				.forEach((r) => r.remove());
		});
		regionPlugin.on('region-updated', (region) => {
			// Keep loop markers in the audio engine updated
			audioEngine.updateLoop(region.start, region.end);
		});
		// Clear region if audio engine loop is cleared
		$effect(() => {
			if (!audioEngine.loop) regionPlugin.clearRegions();
		});
		// Set region color on enable/disable
		$effect(() => {
			if (audioEngine.enableLooping)
				regionPlugin.getRegions().forEach((r) => {
					r.setOptions({ color: '#e7000b36' });
				});
			else
				regionPlugin.getRegions().forEach((r) => {
					r.setOptions({ color: '#71717b26' });
				});
		});

		onDestroy(() => ws?.destroy());
	});

	// Maintain height
	$effect(() => {
		ws.setOptions({ height: h - TW_SPACING * 4 });
	});

	// --- Helpers ---
	const getZoomLevel = () => {
		// Fraction of the total duration that is visible
		return ws.getWidth() / ws.getWrapper().scrollWidth;
	};

	// --- Actions ---
	const zoomIn = () => {
		const oldPxPerSec = ws.getWidth() / (getZoomLevel() * audioEngine.bufferDuration);
		ws.zoom(oldPxPerSec * 1.2);
	};
	const zoomOut = () => {
		const oldPxPerSec = ws.getWidth() / (getZoomLevel() * audioEngine.bufferDuration);
		ws.zoom(oldPxPerSec * 0.8);
	};
	const centerToPlayhead = () => {
		const zoom = getZoomLevel();
		if (zoom === 1) return; // Return early if the waveform is fully zoomed out
		// Number of seconds that are visible
		const visibleTime = ws.getDuration() * zoom;
		ws.setScrollTime(ws.getCurrentTime() - visibleTime / 2);
	};
	const resetZoom = () => {
		ws.zoom(1);
		ws.setScrollTime(0);
	};
</script>

{#if audioEngine.isLoading}
	<div class="flex h-full w-full items-center justify-center">
		<Spinner />
	</div>
{/if}
<div class="flex h-full w-full flex-row items-center">
	<div class="flex w-16 flex-col items-center justify-center gap-2 pb-4">
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="outline" size="icon" onclick={zoomIn}><ZoomIn /></Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Zoom In</Tooltip.Content>
		</Tooltip.Root>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="outline" size="icon" onclick={zoomOut}><ZoomOut /></Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Zoom Out</Tooltip.Content>
		</Tooltip.Root>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="outline" size="icon" onclick={resetZoom}>
					<ScanSearch />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Reset Zoom</Tooltip.Content>
		</Tooltip.Root>
		<Tooltip.Root>
			<Tooltip.Trigger>
				<Button variant="outline" size="icon" onclick={centerToPlayhead}>
					<UnfoldHorizontal />
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="right">Center to Playhead</Tooltip.Content>
		</Tooltip.Root>
	</div>
	<div
		id="waveform"
		bind:this={container}
		class="relative h-full w-full transition-opacity duration-500 select-none"
		class:opacity-0={audioEngine.isLoading}
		style="width: {w - 16 * TW_SPACING}px;"
	></div>
</div>

<style>
	/* Horizontal scrollbar */
	:global(#waveform ::part(scroll)) {
		scrollbar-color: var(--color-muted-foreground) transparent;
	}

	/* Cursor tip */
	:global(#waveform ::part(cursor):after) {
		color: var(--color-destructive);
		font-size: 18px;
		content: '▼';
		position: absolute;
		translate: -6.3px -10px;
	}

	/* Loop region handles */
	:global(#waveform ::part(region-handle-right)),
	:global(#waveform ::part(region-handle-left)) {
		cursor: col-resize;
	}
</style>
