<!-- Error.svelte
An error indicator. -->
<script>
	import Icon from '@iconify/svelte';
	import { passClassList } from '../../lib/utils.js';

	export let size = 'medium';
	export let message = null; // Optional error message
	const SIZE_TO_CLASS = {
		big: 'text-4xl',
		medium: 'text-lg',
		small: ''
	};
	const SIZE_TO_ICON_SIZE = {
		big: 'text-7xl',
		medium: 'text-7xl',
		small: 'text-lg'
	};
</script>

<div class={passClassList([SIZE_TO_CLASS, 'flex flex-col items-center justify-center'])}>
	<span class={SIZE_TO_ICON_SIZE[size]}><Icon icon="material-symbols:warning" /></span>
	<!-- Add error message if not set -->
	{#if message !== null}
		<p>{message}</p>
	{/if}
</div>
