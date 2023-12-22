// Detect target platform: app supports multiple
import {adapter as nodeAdapter} from '@sveltejs/adapter-node';
import {adapter as netlifyAdapter} from '@sveltejs/adapter-netlify';
import {vitePreprocess} from "@sveltejs/vite-plugin-svelte";
let TARGET_ADAPTER = import.meta.env.VITE_TARGET_ADAPTER
if (TARGET_ADAPTER === undefined){
	console.warn("You have not set the target platform - will use \"node\" as a target adapter when building!")
	TARGET_ADAPTER = "node"
}
let adapterConfigToUse ={}
let adapterToUse = null
if (TARGET_ADAPTER === "node"){
	adapterToUse = nodeAdapter
	adapterConfigToUse = {}
}
else if (TARGET_ADAPTER === "netlify"){
	adapterToUse = netlifyAdapter
	adapterConfigToUse = {}
}
else {
	console.error("CRITICAL: can not detect what adapter to use. Please check your VITE_TARGET_ADAPTER variable! The code will probably crash soon:)")
}
/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
		// If your environment is not supported or you settled on a specific environment, switch out the adapter.
		// See https://kit.svelte.dev/docs/adapters for more information about adapters.
		adapter: adapterToUse(adapterConfigToUse),
	},
	preprocess: vitePreprocess()
};

export default config;
