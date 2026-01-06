<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';

	let {
		ref = $bindable(null)
	}: {
		ref?: HTMLDivElement | null;
	} = $props();
</script>

<Card.Root class="rounded-b-none p-4" bind:ref>
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
