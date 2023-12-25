<script>
	import Icon from '@iconify/svelte';
	export let message = null;
	export let size = 'medium'; // "big", "medium" or "small"
	const SIZE_TO_CLASS = {
		big: 'text-7xl',
		medium: 'text-3xl',
		small: ''
	};
</script>

<p class={`${SIZE_TO_CLASS[size]}`}><Icon class="animate-spin" icon="tdesign:loading"></Icon></p>
{#if message !== null}
	<p>{message}</p>
{/if}
<slot />
