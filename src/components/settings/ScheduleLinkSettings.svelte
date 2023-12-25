<script>
	import { handleScheduleLinkSetting } from '../../lib/settingEventHandlers.js';
	import ScheduleLinkInputScreen from '../setup/ScheduleLinkInputScreen.svelte';
	export let settings;
</script>

<h2 class="text-2xl font-bold">Schemalänk</h2>
<p class="py-3">
	Ändra den länk som schemaevent hämtas från. Detta ska vara din personliga KTH-schemalänk.
</p>
<ScheduleLinkInputScreen
	filledInLink={settings.scheduleURL}
	on:scheduleLink={(event) => {
		handleScheduleLinkSetting(event, settings);
	}}
/>
