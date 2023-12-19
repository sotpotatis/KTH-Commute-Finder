<!-- TravelMethodPreferences.svelte
The section of the settings where you can change your travel method preferences. -->
<script>

    import TravelMethodPreferencesScreen from "../setup/TravelMethodPreferencesScreen.svelte";
    import {handleAvoidedTravelMethodsSetting} from "../../lib/settingEventHandlers.js";
    export let settings;
</script>
<h2 class="text-2xl font-bold">Önskade färdsätt</h2>
<p class="py-3">Alla rutter som inkluderar färdsätt du inaktiverar här kommer inte inkluderas i sökresultat.</p>
<div class="flex flex-col gap-y-3">
<TravelMethodPreferencesScreen compactMode={true} avoidedTravelMethods={settings.avoidedTravelMethods !== null ? settings.avoidedTravelMethods: []} on:avoidedTravelMethodsUpdated={(event)=>{
        handleAvoidedTravelMethodsSetting(event, settings)
        settings = settings
}}/>
</div>
<p class="py-3 text-sm"><b>Notera:</b> om du inaktiverar för många färdsätt kanske du inte får några sökresultat alls!</p>
