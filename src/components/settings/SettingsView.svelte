<!--SettingsView.svelte
The settings view offers the user to edit certain settings regarding the application,
such as what stations has been saved.
-->
<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import IconButton from '../generic/IconButton.svelte';
	import StationSettings from './StationSettings.svelte';
	import TravelMethodPreferencesSettings from './TravelMethodPreferencesSettings.svelte';
	import { Settings } from '../../lib/settings.js';
	import ScheduleLinkSettings from './ScheduleLinkSettings.svelte';
	import Icon from '@iconify/svelte';
	import Button from '../generic/Button.svelte';
	import ApplicationCredits from '../generic/ApplicationCredits.svelte';
	const dispatch = createEventDispatcher();
	$: settings = new Settings().getProxy();
	onMount(() => {
		// Load settings when the component mounts
		settings.loadFromLocalStorage();
	});
</script>

<!-- Add close button -->
<div class="fixed top-0 right-0 p-4 md:p-8">
	<IconButton
		iconName="gridicons:cross"
		size="big"
		on:click={() => {
			dispatch('settingsViewClosed');
		}}
	/>
</div>
<h1 class="text-3xl font-bold">Inställningar</h1>
<!-- Add setting for KTH schedule link -->
<ScheduleLinkSettings {settings} />
<!-- Add settings for saved stations -->
<StationSettings {settings} />
<!-- Add settings for travel method preferences -->
<TravelMethodPreferencesSettings {settings} />
<!-- Add short credit information -->
<ApplicationCredits />
