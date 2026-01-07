<script lang="ts">
	import audioEngine from '$lib/engine/engine.svelte';

	const supportedModifiers = ['Shift', 'Control', 'Meta'] as const;
	interface Shortcut {
		/** The {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent | KeyboardEvent}.key to listen to */
		key: string | string[];
		/** The modifers that need to be pressed. See{@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/getModifierState#modifier_keys_on_firefox} */
		modifiers?: (typeof supportedModifiers)[number][];
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

		// Volume
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

		// Playback speed
		{
			key: 'ArrowUp',
			modifiers: ['Shift'],
			callback: () => audioEngine.playbackSpeedUp()
		},
		{
			key: 'ArrowDown',
			modifiers: ['Shift'],
			callback: () => audioEngine.playbackSpeedDown()
		},
		{
			key: 'KeyR',
			callback: () => audioEngine.setPlaybackSpeed(1)
		},

		// Seeking
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
		},

		// Looping
		{
			key: 'KeyT',
			callback: () => audioEngine.toggleLooping()
		},
		{
			key: 'KeyC',
			callback: () => audioEngine.clearLoop()
		}
	];

	function handle(e: KeyboardEvent) {
		const shortcut = shortcuts.find((s) => {
			// Check for key
			const keyPressed = Array.isArray(s.key) ? s.key.includes(e.code) : s.key === e.code;
			if (!keyPressed) return false;

			// Check that the pressed modifiers match the required modifiers exactly
			const modifierMask = supportedModifiers.map(
				(m) => e.getModifierState(m) === (s.modifiers || []).includes(m)
			);
			return modifierMask.every(Boolean);
		});
		if (shortcut) {
			e.preventDefault();
			shortcut.callback?.(e);
		}
	}
</script>

<svelte:window on:keydown={handle} />
