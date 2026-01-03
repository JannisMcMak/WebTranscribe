<script lang="ts">
	import audioEngine from '$lib/engine/engine.svelte';

	interface Shortcut {
		/** the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent | KeyboardEvent}.key to listen to */
		key: string;
		callback?: (e: KeyboardEvent) => void;
	}

	const shortcuts: Shortcut[] = [
		{
			key: 'Space',
			callback: () => audioEngine.togglePlay()
		},
		{
			key: 'Escape',
			callback: () => audioEngine.stop()
		},
		{
			key: 'ArrowUp',
			callback: () => audioEngine.volumeUp()
		},
		{
			key: 'ArrowDown',
			callback: () => audioEngine.volumeDown()
		}
	];

	function handle(e: KeyboardEvent) {
		const shortcut = shortcuts.find((s) => s.key === e.code);
		if (shortcut) {
			shortcut.callback?.(e);
		}
	}
</script>

<svelte:window on:keydown={handle} />
