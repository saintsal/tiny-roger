import preprocess from 'svelte-preprocess';
import adapter from 'sveltejs-adapter-ipfs';
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
		adapter: adapter({
			pages: 'build',
			strict: true,
			// works with sveltekit master
			skipSingletonsAndPathsFiles: true,
			skipReplacementInIndexHTML: true,
		}),
		version: {
			name: VERSION,
		},
		alias: {
			'web-config': './src/web-config.json',
		},
		serviceWorker: {
			register: false,
		},
	},
};

export default config;
