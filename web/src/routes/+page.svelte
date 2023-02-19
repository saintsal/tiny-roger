<script>
	import Showcase from '$lib/components/website/Showcase.svelte';
	import Feature from '$lib/components/website/Feature.svelte';
</script>

<section class="pb-2 px-4 text-center">
	<div class="max-w-auto md:max-w-lg mx-auto">
		<img
			class="mb-8 mx-auto"
			src="/images/logo.svg"
			alt="Jolly-Roger"
			style="width:256px;height:256px;"
			width="256px"
			height="256px"
		/>
		<h2 class="mb-2 !text-6xl font-black">Jolly Roger</h2>
		<p class="m-6 !text-xl">Production-Ready Template To Build Decentralised Applications</p>
		<div class="max-w-md mx-auto pt-1 mt-5 space-y-3 md:m-8 md:space-y-5">
			<div class="space-y-5 sm:flex sm:justify-center sm:space-y-0 sm:space-x-3">
				<a class="btn btn-primary btn-wide" href="/demo/" aria-label="Try the Demo!">Demo</a>
				<a
					class="btn btn-secondary btn-wide"
					target="_blank"
					rel="noreferrer"
					href="https://github.com/wighawag/jolly-roger"
					aria-label="Check it out on github!"
				>
					Github
				</a>
			</div>
		</div>

		<div class="pt-3 pb-4 ">
			<h1 class="m-4 font-semibold">Use it:</h1>
			<div class="bg-reverse-primary rounded-box p-2 box-content">
				<code id="jolly-roger-command" class="mb-5 text-primary font-black rounded-box"
					>npx degit wighawag/jolly-roger your-app-folder</code
				>
			</div>
			<p class="mt-6 text-base-300">
				Find out more on
				<a
					class="underline"
					href="https://github.com/wighawag/jolly-roger#readme"
					target="_blank"
					rel="noreferrer">github</a
				>
			</p>
		</div>
	</div>

	<div class="pt-16 relative max-w-7xl mx-auto">
		<div class="text-center">
			<h2 class="text-3xl tracking-tight font-extrabold sm:text-4xl">Showcase</h2>
			<p class="mt-3 max-w-2xl mx-auto text-xl  sm:mt-4">
				Here are examples of apps built using jolly-roger
			</p>
		</div>
		<div class="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
			<Showcase
				href="https://bleeps.art"
				preview="https://bleeps.art/preview.png"
				name="bleeps.art"
				title="The Bleeps DAO and Its Fully Onchain Sounds"
				description="The First Composable Sounds Fully Generated On-Chain With Zero Externalities, no backend, no ipfs, no client-code, and a melody minter where some of the proceeds goes to the Bleeps DAO and its members"
				source="https://github.com/wighawag/bleeps"
			/>

			<Showcase
				href="https://mandalas.eth.limo"
				preview="https://mandalas.eth.limo/preview.png"
				name="mandalas.eth"
				title="On-chain Generative Bitmaps With Zero Externalities"
				description="The First On-Chain Generative Art Project to make full use of token URI to remove all external dependencies. It generates SVG and Bitmap from the smart contract directly."
				source="https://github.com/wighawag/mandalas"
			/>

			<Showcase
				href="https://conquest.eth.limo"
				preview="https://conquest.eth.limo/preview.png"
				name="conquest.eth"
				title="A Game of Strategy and Diplomacy Running on the EVM"
				description="An unstoppable game of strategy and diplomacy running on the EVM. It allows player to collaborate through on-chain alliances while remaining sovereign. A first of its kind."
			/>
		</div>

		<div class="pt-16 pb-4">
			<h2 class="text-3xl tracking-tight font-extrabold sm:text-4xl">Features</h2>
			<div class="max-w-xl mx-auto px-4 sm:px-6 lg:max-w-screen-xl lg:px-8">
				<div class="lg:grid lg:grid-cols-3 lg:gap-8">
					<Feature title="All Included">
						This template include setup for smart contracts, subgraph (contract api) and frontend.
						All is setup as a monorepo with a shared common library.
					</Feature>
					<Feature title="PWA ready: 100% Lighthouse score">
						The web app is fully PWA compliant, with offline caching, etc... The javascript code
						necessary to launch the app is less than 50kB (15kB compressed), including the home page
						content. The rest is loaded on demand.
					</Feature>
					<Feature title="Great Dev experience">
						<a class="link" href="https://hardhat.org" target="_blank" rel="noreferrer">Hardhat</a>
						for contracts,
						<a
							class="link"
							href="https://github.com/wighawag/hardhat-deploy"
							target="_blank"
							rel="noreferrer">hardhat-deploy</a
						>
						for contract deployment,
						<a class="link" href="https://thegraph.com" target="_blank" rel="noreferrer"
							>The Graph</a
						>
						for contract api,
						<a class="link" href="https://svelte.dev" target="_blank" rel="noreferrer"
							>svelte + Svelte Kit</a
						>
						for frontend with HMR (Hot Module Replacement) and production build.
					</Feature>
					<Feature title="Everything Hot Reload">
						On contract changes, contract get to keep their address and code get updated
						automatically. On frontend changes, module get replaced using blazing fast
						<a class="link" href="https://vite.dev" target="_blank" rel="noreferrer">Vite</a>
						es module hot reload. On subgraph changes, the graph get updated and reexecuted.
					</Feature>
					<Feature title="Fully IPFS Ready">
						Fully IPFS ready with proper url routing. The web app works on both IPFS urls and
						ENS/DNS urls. PWA works on IPFS too with scoped service workers.
					</Feature>
					<Feature title="All in Typescript"
						>The whole app including contracts tests, is written in typescript.</Feature
					>
					<Feature title="Code Splitting and Tree Shaking">
						By using Svelte Kit (and so Vite) and ES modules, the frontend benefit from code
						splitting an dynamic imports as well as tree shaking.
					</Feature>
					<Feature title="VSCode Setup">
						The repo is setup as a vscode workspace with recommended plugins. Execute tests from the
						editor. Auto format, etc...
					</Feature>
					<Feature title="One command deploy">
						Everything is setup, except for the private ENV variable to deploy the contracts, the
						subgraph and the web app, all at once. It also include
						<a class="link" href="https://fleek.co" target="_blank" rel="noreferrer">fleek</a>
						config for automatic web deployment on ipfs.
					</Feature>
				</div>
			</div>
		</div>
	</div>
</section>
