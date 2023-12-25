<!-- Button.svelte
A button with different styles, sizes, etc. etc. -->
<script>
	import { passClassList } from '../../lib/utils.js';
	export let color = 'green';
	export let multipleItems = false; // Set to true to use multiple items (e.g. icon and text) inside the button
	export let disabled = false;
	export let circular = false;
	export let extraClasses = [];
	const COLOR_TO_CLASSES = {
		// Mapping: button color name --> classes to apply
		green: 'bg-emerald-400 text-white border-emerald-500',
		gray: 'bg-slate-300 text-gray-600 border-slate-400',
		indigo: 'bg-indigo-400 border-indigo-500',
		red: 'bg-red-400 text-white border-red-500',
		yellow: 'bg-amber-300 text-white border-amber-500',
		blue: 'bg-blue-400 text-white border-blue-500',
		link: 'text-white font-bold' // "link style" button
	};
	export let size = 'medium';
	const SIZES_TO_CLASSES = {
		small: 'p-1',
		text: 'text-base', // Make the button have the same size and behavior as text (no padding for example)
		medium: 'px-3 py-1 text-lg',
		big: 'px-6 py-3 text-xl font-bold'
	};
	$: classesToApply = [
		// Add any classes passed by the user. Put them first to ensure priority
		...(extraClasses !== null && extraClasses !== undefined ? extraClasses : []),
		COLOR_TO_CLASSES[color],
		SIZES_TO_CLASSES[size],
		'max-w-fit',
		'hover:cursor-pointer',
		'hover:underline',
		!circular ? 'rounded-lg' : 'rounded-full',
		'disabled:opacity-70',
		'disabled:cursor-not-allowed',
		// The "link" color has no border
		color !== 'link' ? 'border-2' : 'underline',
		multipleItems ? 'flex gap-x-2 flex-row items-center' : ''
	];
</script>

<button data-color={color} {disabled} on:click class={passClassList(classesToApply)}
	><slot /></button
>
