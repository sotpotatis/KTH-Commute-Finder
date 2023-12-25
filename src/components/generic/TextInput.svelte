<!-- TextInput.svelte
A generic text input box -->
<script>
	import { passClassList } from '../../lib/utils.js';
	import Icon from '@iconify/svelte';
	export let disabled = false;
	export let placeholder = null;
	export let name = null;
	export let value = undefined;
	export let error = false;
	export let success = false;
	export let loading = false;
	// The user can add error messages if they want to.
	export let errorMessage = null;
	// ...same for success messages
	export let successMessage = null;
	// ...and for loading messages
	export let loadingMessage = null;
	let classesToApply = [
		'text-gray-800 bg-white px-3 py-1 border-2 rounded-lg hover:cursor-pointer ring-2 m-3'
	];
	// Decide border color
	if (error) {
		classesToApply.push(...['border-red-400', 'selected:ring-red-400']);
	} else if (success) {
		classesToApply.push(...['selected:ring-green-400', 'border-green-400']);
	} else {
		classesToApply.push(...['border-gray-200']);
	}
</script>

<input
	{value}
	{name}
	{placeholder}
	class={passClassList(classesToApply)}
	{disabled}
	on:keydown
	on:keyup
	on:change
	on:input
/>
<!-- Add error if set -->
{#if error}
	<p class="text-sm text-red-400 flex flex-row gap-x-2">
		<Icon icon="mingcute:warning-fill" />
		{errorMessage !== null ? errorMessage : ''}<slot name="errorMessage" />
	</p>
{/if}
{#if success}
	<p class="text-sm text-green-400 flex flex-row gap-x-2">
		<Icon icon="icon-park-solid:check-one" />
		{successMessage !== null ? successMessage : ''}<slot name="successMessage" />
	</p>
{/if}
{#if loading}
	<p class="text-sm text-white text-green-400 flex flex-row gap-x-2">
		<Icon icon="line-md:loading-loop" />{loadingMessage !== null ? loadingMessage : ''}<slot
			name="loadingMessage"
		/>
	</p>
{/if}
