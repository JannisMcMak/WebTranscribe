<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import PlayIcon from '@lucide/svelte/icons/play';
	import PauseIcon from '@lucide/svelte/icons/pause';
	import { cn } from '$lib/utils';
	import { twMerge } from 'tailwind-merge';

	interface Props {
		isPlaying: boolean;
		onClick: () => void;
	}
	let { isPlaying, onClick }: Props = $props();
</script>

<Button variant="outline" size="icon" onclick={onClick}>
	<PlayIcon
		class={twMerge(
			'absolute h-[1.2rem] w-[1.2rem] transition-all!',
			isPlaying ? 'scale-0 -rotate-90' : 'scale-100 rotate-0'
		)}
	/>
	<PauseIcon
		class={twMerge(
			'absolute h-[1.2rem] w-[1.2rem] transition-all!',
			isPlaying ? 'scale-100 rotate-0' : 'scale-0 rotate-90'
		)}
	/>
	<!-- Additional icon for button sizing -->
	<PlayIcon class="invisible h-[1.2rem] w-[1.2rem]" />
</Button>
