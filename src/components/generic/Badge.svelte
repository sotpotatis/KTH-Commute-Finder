<!-- Badge.svelte
A customizable badge.
-->
<script>
	import { passClassList } from '../../lib/utils.js';
	export let color = 'purple';
	export let size = 'small';
	export let text;
	export let circular = true;
	export let flexbox = true; // Can be set to disable the badge applying flexbox styling
	// Define colors
	const BADGE_COLORS_TO_CLASSES = {
		purple: 'bg-purple-600 text-white',
		lightBlue: 'bg-cyan-500 text-white',
		darkYellow: 'bg-yellow-700 text-white',
		mutedDarkBlue: 'bg-cyan-600 text-white',
		mutedGreen: 'bg-green-600 text-white',
		gray: 'bg-gray-500 text-white'
	};
	// Define font sizes
	const BADGE_SIZES_TO_CLASSES = {
		small: 'text-base',
		medium: 'text-lg',
		big: 'text-2xl'
	};
	export let isClickable = false;
	export let isDisabled = false;
	let classesToApply = [
		BADGE_COLORS_TO_CLASSES[color],
		BADGE_SIZES_TO_CLASSES[size],
		'font-bold',
		circular ? 'rounded-full' : 'rounded-lg',
		'px-3 py-3 w-fit'
	];
	if (isClickable) {
		// Add button-related classes if clickable
		classesToApply.push(
			...[
				!isDisabled ? 'hover:cursor-pointer' : 'hover:cursor-not-allowed',
				'hover:opacity-70',
				'select-none'
			]
		);
	}
	if (flexbox) {
		// Render as flexbox if set
		classesToApply.push(...['flex', 'flex-row']);
	}
</script>

<span role={isClickable ? 'button' : null} class={passClassList(classesToApply)} on:click>
	<slot name="text" />{text}
	<slot name="badge" /></span
>
