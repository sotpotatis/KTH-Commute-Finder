<!-- StationPickerView.svelte
Allows the user to pick what station that they want to travel from.
-->
<script>
    import {createEventDispatcher, onMount} from "svelte";
    import Badge from "../../generic/Badge.svelte";
    import {getSetting, getUserSettings, Settings} from "../../../lib/settings.js";
    // Get the user's saved stations. And for that we need the settings!
    $: settings = new Settings().getProxy()
    $: userSavedStations = []
    const dispatch = createEventDispatcher()
    onMount(()=>{
        userSavedStations = settings.savedStations
        console.log("User's saved stations are:", userSavedStations)
    })
</script>
<h1 class="text-3xl font-bold py-3">Vart vill du resa ifrån?</h1>
<p>Välj vilken station du vill resa ifrån.</p>
<div class="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-4 items-center justify-center text-center py-3">
    {#each userSavedStations as userSavedStation}
        <div>
            <Badge color={"purple"} isClickable={
            true
            } on:click={()=>{
                console.log("Station picked picked. Dispatching event...", userSavedStation)
                dispatch("stationPicked", {location: userSavedStation})
            }} text={userSavedStation.name}>
            </Badge>
        </div>
    {/each}
</div>