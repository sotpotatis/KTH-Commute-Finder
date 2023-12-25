<!-- SettingsButton
A button to summon the settings view of the page.
-->
<script>
	import IconButton from '../generic/IconButton.svelte';
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
</script>

<div class="fixed right-0 bottom-0 p-8">
	<IconButton
		backgroundColor="blue"
		noBorder={true}
		size="big"
		iconName="clarity:cog-solid"
		on:click={() => {
			dispatch('settingsButtonClicked');
		}}
	/>
</div>
