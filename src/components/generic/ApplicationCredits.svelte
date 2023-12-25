<!-- ApplicationCredit.svelte
Some general information about this project, who created it and that it is open source. -->
<script>
	import Button from './Button.svelte';
	import Icon from '@iconify/svelte';
</script>

<hr class="w-screen px-2 py-4" />
<footer class="absolute">
	<p class="font-bold text-sm py-4">
		Made with <Icon icon="mdi:heart" /> by <Button
			size="text"
			color="link"
			on:click={() => {
				window.open('https://albins.website', '_blank');
			}}>Albin Seijmer</Button
		>
	</p>
	<p class="font-bold text-sm">
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
