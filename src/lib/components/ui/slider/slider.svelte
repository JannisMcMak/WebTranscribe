<script lang="ts">
	import { Slider as SliderPrimitive } from 'bits-ui';
	import { cn, type WithoutChildrenOrChild } from '$lib/utils.js';

	let {
		ref = $bindable(null),
		value = $bindable(),
		orientation = 'horizontal',
		class: className,
		valueFormatter = (value) => `${value}`,
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
		'relative flex w-full touch-none items-center rounded-md select-none data-disabled:opacity-50',
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-orientation={orientation}
			data-slot="slider-track"
			class={cn(
				'relative h-9 w-full grow overflow-hidden rounded-md border bg-background shadow-xs dark:border-input dark:bg-input/30'
			)}
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class={cn('absolute h-full bg-muted-foreground/10')}
			/>
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class="block h-full w-1.5 shrink-0 rounded-md bg-muted-foreground shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
			/>
		{/each}
		<span
			class="absolute font-mono text-xs text-muted-foreground"
			class:left-2={(value as number) > (restProps?.max || 1) / 2}
			class:right-2={(value as number) <= (restProps?.max || 1) / 2}
		>
			{valueFormatter(value as number)}
		</span>
	{/snippet}
</SliderPrimitive.Root>
