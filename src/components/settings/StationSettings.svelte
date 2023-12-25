<!-- StationSettings.svelte
The section of the settings where you can change what stations to include
in your list of saved stations -->
<script>
	import StationInputScreen from '../setup/StationInputScreen.svelte';
	import { handleSavedStationsSetting } from '../../lib/settingEventHandlers.js';
	export let settings;
</script>

<h2 class="text-2xl font-bold">Sparade stationer</h2>
<p class="py-3">
	Lägg till vilka stationer som ska dyka upp i listan bland val när du söker resor.
</p>
{#if settings !== null}
	<StationInputScreen
		compactMode={true}
		stations={settings.savedStations != null ? settings.savedStations : []}
		on:stationsUpdated={(event) => {
			handleSavedStationsSetting(event, settings);
		}}
	/>
{/if}
