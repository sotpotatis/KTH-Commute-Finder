<!-- DotIndicators.svelte
Dot indicators for indicating the current step of something, for example -->
<script>
	import { passClassList } from '../../lib/utils.js';

	export let color = 'gray';
	export let numberOfDots;
	export let currentlyActiveDot;
	// Define colors
	const DOT_INDICATOR_COLORS_TO_CLASSES = {
		gray: 'bg-gray-900 text-white'
	};
</script>

<!-- Render all the dots -->
<div
	class={passClassList([
		DOT_INDICATOR_COLORS_TO_CLASSES[color],
		'opacity-50',
		'flex',
		'flex-row',
		'gap-x-2',
		'px-3',
		'py-1',
		'max-w-min',
		'rounded-full'
	])}
>
	{#each { length: numberOfDots } as _, i}
		<span class={`${i + 1 === currentlyActiveDot ? '' : 'opacity-40'} text-lg font-black`}
			>&#8226;</span
		>
	{/each}
</div>
