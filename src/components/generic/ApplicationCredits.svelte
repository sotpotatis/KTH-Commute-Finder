<!-- ApplicationCredit.svelte
Some general information about this project, who created it and that it is open source. -->
<script>
	import Button from './Button.svelte';
	import Icon from '@iconify/svelte';
	const PARAGRAPH_FLEX_CLASSES = 'flex flex-row gap-x-1'; // Used for displaying text, icon and button/link on the same row (see below).
</script>

<hr class="w-screen px-2 py-4" />
<footer>
	<p class={`font-bold text-sm py-4 ${PARAGRAPH_FLEX_CLASSES}`}>
		Made with <Icon icon="mdi:heart" /> by <Button
			size="text"
			color="link"
			on:click={() => {
				window.open('https://albins.website', '_blank');
			}}>Albin Seijmer</Button
		>
	</p>
	<p class={`font-bold text-sm ${PARAGRAPH_FLEX_CLASSES}`}>
		Open source on <Icon icon="mdi:github" />
		<Button
			size="text"
			color="link"
			on:click={() => {
				window.open('https://github.com/sotpotatis/KTH-Commute-Finder', '_blank');
			}}>Github</Button
		>
	</p>
</footer>
