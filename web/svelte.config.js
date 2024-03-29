import preprocess from 'svelte-preprocess';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/kit/vite';
import { execSync } from 'child_process';

const VERSION = execSync('git rev-parse --short HEAD').toString().trim();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: [
		vitePreprocess(),
		preprocess({
			postcss: true,
		}),
	],

	kit: {
		adapter: adapter(),
		version: {
			name: VERSION,
		},
		alias: {
			'web-config': './src/web-config.json',
		},
		serviceWorker: {
			register: false,
		},
		paths: {
			relative: true,
		},
	},
};

export default config;
