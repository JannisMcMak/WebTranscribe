import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const file = fileURLToPath(new URL('package.json', import.meta.url));
const json = readFileSync(file, 'utf8');
const pkg = JSON.parse(json);

// https://vite.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), svelte()],
	resolve: { alias: { $lib: path.resolve('./src/lib') } },
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version)
	}
});
