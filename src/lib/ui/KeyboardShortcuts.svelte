<script lang="ts">
	import audioEngine from '$lib/engine/engine.svelte';

	interface Shortcut {
		/** the {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent | KeyboardEvent}.key to listen to */
		key: string | string[];
		callback?: (e: KeyboardEvent) => void;
	}

	const shortcuts: Shortcut[] = [
		{
			key: ['Space', 'KeyK'],
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
		},
		{
			key: 'KeyM',
			callback: () => audioEngine.volumeMute()
		},
		{
			key: 'ArrowRight',
			callback: () => audioEngine.seekBy(3)
		},
		{
			key: 'ArrowLeft',
			callback: () => audioEngine.seekBy(-3)
		},
		{
			key: 'KeyL',
			callback: () => audioEngine.seekBy(7)
		},
		{
			key: 'KeyJ',
			callback: () => audioEngine.seekBy(-7)
		},
		{
			key: 'KeyL',
			callback: () => audioEngine.seekBy(7)
		},
		{
			key: 'KeyJ',
			callback: () => audioEngine.seekBy(-7)
		},
		{
			key: 'Period',
			callback: () => audioEngine.seekBy(0.5)
		},
		{
			key: 'Comma',
			callback: () => audioEngine.seekBy(-0.5)
		}
	];

	function handle(e: KeyboardEvent) {
		const shortcut = shortcuts.find((s) =>
			Array.isArray(s.key) ? s.key.includes(e.code) : s.key === e.code
		);
		if (shortcut) shortcut.callback?.(e);
	}
</script>

<svelte:window on:keydown={handle} />
