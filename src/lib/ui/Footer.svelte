<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import type { ClassValue } from 'clsx';
	import { cn } from '$lib/utils';

	let {
		ref = $bindable(null),
		class: className
	}: {
		ref?: HTMLDivElement | null;
		class: ClassValue;
	} = $props();
</script>

<Card.Root class={cn(className, 'h-auto w-full rounded-b-none bg-sidebar p-4')} bind:ref>
	<Card.Header class="flex items-center justify-between p-0">
		<Card.Title class="font-bold">
			WebTranscribe
			<span class="text-sm font-normal text-muted-foreground">v{__APP_VERSION__}</span>
		</Card.Title>
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
</Card.Root>
