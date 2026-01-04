<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = 'horizontal',
		valueFormatter,
		class: className,
		...restProps
	}: WithoutChildrenOrChild<SliderPrimitive.RootProps> & {
		valueFormatter?: (value: number) => string;
	} = $props();
</script>

<!--
Discriminated Unions + Destructing (required for bindable) do not
get along, so we shut typescript up by casting `value` to `never`.
-->
<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	data-slot="slider"
	{orientation}
	class={cn(
		'relative flex w-full touch-none items-center select-none data-disabled:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-orientation={orientation}
			data-slot="slider-track"
			class={cn(
				'relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5'
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn(
					'absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full'
				)}
			/>
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class="block size-4 shrink-0 rounded-full border border-primary bg-white shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
			/>
			{#if valueFormatter}
				<SliderPrimitive.ThumbLabel
					index={thumb.index}
					class="mb-2 rounded-md bg-muted px-2 py-0.5 text-xs text-nowrap text-foreground"
				>
					{valueFormatter(thumb.value)}
				</SliderPrimitive.ThumbLabel>
			{/if}
		{/each}
	{/snippet}
</SliderPrimitive.Root>
