import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const dev = process.argv.includes('dev');

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],
	kit: {
		// adapter-static is required for GitHub Pages
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			// Fallback lets client-side routing work on GitHub Pages
			fallback: '404.html',
			strict: false
		}),
		paths: {
			// IMPORTANT: use your repo name here
			base: dev ? '' : '/F2LTrainer'
		}
	},
	extensions: ['.svelte', '.svx']
};

export default config;
