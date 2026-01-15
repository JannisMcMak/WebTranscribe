<script lang="ts">
	import WaveSurfer from 'wavesurfer.js';
	import Timeline from 'wavesurfer.js/dist/plugins/timeline.js';
	import Region from 'wavesurfer.js/dist/plugins/regions.js';
	import Hover from 'wavesurfer.js/dist/plugins/hover.js';
	import Zoom from 'wavesurfer.js/dist/plugins/zoom.js';
	import { onMount, onDestroy, type Snippet } from 'svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { waveformState } from '$lib/stores.svelte';
	import { formatTime } from '$lib/utils';
	import { Spinner } from '$lib/components/ui/spinner';

	interface Props {
		h: number;
		children?: Snippet;
	}
	let { h, children }: Props = $props();

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
			height: h,
			waveColor: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground'),
			progressColor: getComputedStyle(document.documentElement).getPropertyValue(
				'--accent-foreground'
			),
			cursorColor: getComputedStyle(document.documentElement).getPropertyValue('--destructive'),
			plugins: [timelinePlugin, hoverPlugin, zoomPlugin, regionPlugin]
		});
		
		// Maintain height
		$effect(() => {
			ws.setOptions({ height: h });
		});

		// --- Helpers ---
		const getZoomLevel = () => {
			// Fraction of the total duration that is visible
			return ws.getWidth() / ws.getWrapper().scrollWidth;
		};

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

		// --- Sync to global waveform store ---

		// Register global actions
		waveformState.centerToPlayhead = () => {
			const zoom = getZoomLevel();
			if (zoom === 1) return; // Return early if the waveform is fully zoomed out
			// Number of seconds that are visible
			const visibleTime = ws.getDuration() * zoom;
			ws.setScrollTime(ws.getCurrentTime() - visibleTime / 2);
		};
		waveformState.resetZoom = () => {
			ws.zoom(1);
			ws.setScrollTime(0);
		};

		// Sync state variables
		hoverPlugin.on(
			'hover',
			(relX) => (waveformState.hoverPosition = relX * audioEngine.bufferDuration)
		);
		container.addEventListener('mouseleave', () => (waveformState.hoverPosition = 0));
		ws.on('zoom', () => (waveformState.zoom = getZoomLevel()));
		ws.on('scroll', () => {
			waveformState.scrollPosition =
				(ws.getScroll() / ws.getWrapper().scrollWidth) * audioEngine.bufferDuration;
		});

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

		// Rerender on layout/height change
		$effect(() => {
			h;
			ws.getRenderer().reRender();
		});
	});

	onDestroy(() => ws?.destroy());
</script>

{#if audioEngine.isLoading}
	<div class="flex w-full translate-y-28 justify-center">
		<Spinner />
	</div>
{/if}
<div
	id="waveform"
	bind:this={container}
	class="relative h-full transition-opacity duration-500 select-none"
	class:opacity-0={audioEngine.isLoading}
>
	{#if children}
		{@render children()}
	{/if}
</div>

<style>
	:global(#waveform ::part(cursor):after) {
		color: var(--color-destructive);
		font-size: 18px;
		content: '▼';
		position: absolute;
		translate: -6.3px -10px;
	}

	:global(#waveform ::part(region-handle-right)),
	:global(#waveform ::part(region-handle-left)) {
		cursor: col-resize;
	}
</style>
