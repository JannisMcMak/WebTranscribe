<script lang="ts">
	import { analysisState, waveformState } from '$lib/stores.svelte';
	import audioEngine from '$lib/engine/engine.svelte';
	import { TW_SPACING } from '$lib/utils';
	import { buttonVariants } from '$lib/components/ui/button';
	import Settings2 from '@lucide/svelte/icons/settings-2';
	import * as Popover from '$lib/components/ui/popover';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';

	let analysisData = $derived(analysisState.beat);

	let { w, h }: { w: number; h: number } = $props();
	const width = $derived(w - 16 * TW_SPACING); // Space on the left for waveform view control buttons
	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D;

	const visibleDuration = $derived(waveformState.zoom * audioEngine.bufferDuration);
	const visibleBeats = $derived(
		analysisData.values.filter(
			(n) => n > waveformState.scrollPosition && n < waveformState.scrollPosition + visibleDuration
		)
	);

	$effect(() => {
		if (!ctx) ctx = canvas.getContext('2d')!;

		ctx.clearRect(0, 0, width, h);

		visibleBeats.forEach((beat) => {
			const relSeconds = beat - waveformState.scrollPosition;
			const relX = relSeconds / visibleDuration;

			const globalIndex = analysisData.values.indexOf(beat);
			const positionInBar =
				(((globalIndex - analysisData.firstBeatIndex) % analysisData.beatsPerBar) +
					analysisData.beatsPerBar) %
				analysisData.beatsPerBar;
			const isFirstBeat = positionInBar === 0;

			// Draw beat
			ctx.fillStyle = isFirstBeat
				? getComputedStyle(document.documentElement).getPropertyValue('--primary')
				: getComputedStyle(document.documentElement).getPropertyValue('--muted-foreground');
			ctx.beginPath();
			ctx.roundRect(relX * width, 0, isFirstBeat ? 3 : 1, h, 20);
			ctx.fill();

			// Draw beat number label
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.font = '10px monospace';

			ctx.beginPath();
			ctx.roundRect(relX * width - 6, 0, 14, 14, 4);
			ctx.fill();
			ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--secondary');
			const label = isFirstBeat
				? Math.floor(globalIndex / analysisData.beatsPerBar) -
					Math.floor(analysisData.firstBeatIndex / analysisData.beatsPerBar) +
					1
				: positionInBar + 1;
			ctx.fillText(label.toString(), relX * width + 1, 8);
		});
	});

	function onWheel(e: WheelEvent) {
		if (!canvas) return;
		e.preventDefault();
		if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) {
			waveformState.handleScroll(e);
		}
	}
</script>

<div onwheel={onWheel} class="flex rounded-xl">
	<div class="flex w-16 items-center justify-center">
		<Popover.Root>
			<Popover.Trigger class={buttonVariants({ size: 'icon', variant: 'outline' })}>
				<Settings2 />
			</Popover.Trigger>
			<Popover.Content side="bottom" align="start">
				<div class="grid gap-4">
					<div class="space-y-2">
						<h4 class="leading-none font-medium">Settings</h4>
						<p class="text-sm text-muted-foreground">Adjust time signature & beat settings.</p>
					</div>
					<div class="grid gap-2">
						<div class="grid grid-cols-3 items-center gap-4">
							<Label for="beatsPerMeasure" class="col-span-2">Beats per Measure</Label>
							<Input
								type="number"
								id="beatsPerMeasure"
								value={analysisData.beatsPerBar}
								oninput={(e) =>
									(analysisState.beat.beatsPerBar = Number((e.target as HTMLInputElement).value))}
								min={1}
								class="h-8"
							/>
						</div>
						<div class="grid grid-cols-3 items-center gap-4">
							<Label for="firstMeasure" class="col-span-2">First Measure Start</Label>
							<Input
								type="number"
								id="firstMeasure"
								value={analysisData.firstBeatIndex + 1}
								oninput={(e) =>
									(analysisState.beat.firstBeatIndex =
										Number((e.target as HTMLInputElement).value) - 1)}
								min={1}
								class="h-8"
							/>
						</div>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
	<canvas bind:this={canvas} {width} height={h} class="pointer-events-none flex-1 rounded-r-xl"
	></canvas>
</div>
