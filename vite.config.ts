import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';

import { copyFileSync, existsSync, mkdirSync } from 'fs';

function copyStaticAssets() {
	const assets = ['static/manifest.json', 'static/service-worker.js'];
	const outDir = 'dist';
	if (!existsSync(outDir)) mkdirSync(outDir);
	for (const asset of assets) {
		const dest = `${outDir}/${asset.split('/').pop()}`;
		if (existsSync(asset)) copyFileSync(asset, dest);
	}
}

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		chunkSizeWarningLimit: 1024,
		rollupOptions: {
			// Ensure static assets are copied after build
			plugins: [
				{
					name: 'copy-static-assets',
					writeBundle: copyStaticAssets
				}
			]
		}
	},
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					environment: 'browser',
					browser: {
						enabled: true,
						provider: 'playwright',
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.ts']
				}
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
