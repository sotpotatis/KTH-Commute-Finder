<!-- StationInputScreen.svelte
Handles the input/selection of the user's favorite stations.
-->
<script>
    import TextInput from "../generic/TextInput.svelte";
    import * as Promise from "bluebird"; // Used for promise cancellation
    import {createEventDispatcher} from "svelte";
    import APIWrapper from "../../lib/websiteAPI/api.js";
    import Badge from "../generic/Badge.svelte";
    import Icon from "@iconify/svelte";
    import {passClassList, removeItemFromList} from "../../lib/utils.js";
    import Button from "../generic/Button.svelte";
    export let stations; // Can be set dynamically, i.e. from user settings
    export let compactMode = false; // Used to provide a compact mode
    $: showSearchBox = !compactMode
    $: loading = false
    $: error = false
    $: currentSearchQuery = ""
    $: addedStations = stations
    $: searchResults = []
    $: moreThanOneStationAdded = addedStations !== null && addedStations.length > 1
    // Create event dispatcher for when a new station was added or removed
    const dispatch = createEventDispatcher()
    const announceStationsUpdate = ()=>{ // ...and a function to announce the updates
        dispatch("stationsUpdated", {stations: addedStations})

    }
    const api = new APIWrapper()
    let promises = [] // Store other pending searches
    Promise.config({cancellation: true})
</script>
{#if showSearchBox}
    <TextInput
        loading={loading}
        error={error}
        value={currentSearchQuery}
        errorMessage="Tyvärr, något gick fel när stationer skulle hämtas. Testa att komma tillbaka lite senare."
        on:input={(event)=>{
            const searchQuery = event.target.value
            // If a search is relevant
            if (searchQuery.length >= 3){
                // Remove previous promises
                for (const promise of promises){
                    promise.cancel()
                }
                // Start new search
                const search = new Promise((resolve, reject, onCancel)=>{
                    let promiseCancelled = false
                    // Tracks if the promise has been cancelled
                    // Probably a very hacky way to avoid older promises
                    // "getting in the way of" search results.
                    onCancel(()=>promiseCancelled=true)
                    loading = true
                    const searchPromise = api.findStation(searchQuery)
                    searchPromise.then(([requestSuccessful, responseData])=>{
                        loading = false
                        if (promiseCancelled){ // Ignore cancelled promises
                            return
                        }
                        if (requestSuccessful){
                            console.log("Got stations data from API:", responseData)
                            searchResults = responseData.foundStations
                            error = false
                        }
                        else {
                            console.error("Failed to get stations data from API!")
                            error = true
                        }
                    })
                })
                promises.push(search)
            }
        }}
    />
    <!-- Add button to close search if we are in the compact mode -->
    {#if compactMode}
        <Button color="gray" circular={true} multipleItems={true} extraClasses="flex flex-row gap-x-2" on:click={()=>{showSearchBox = false}}>
            <Icon icon="gridicons:cross"/>
            Klar
        </Button>
    {/if}
{:else}
    <!-- If the search box should not be shown -->
    <Button color="green" circular={true} multipleItems={true} extraClasses="flex flex-row gap-x-2" on:click={()=>{showSearchBox = true}}>
        <Icon icon="material-symbols:add"/>
        Lägg till
    </Button>
{/if}
<!-- Add stations that the user has added -->
<!-- Render possible stations to pick from -->
<div class={passClassList(
    [
        "flex gap-y-4 flex-wrap justify-center py-3",
        !compactMode ? "flex-row gap-x-4 px-3 md:px-12": "flex-col"
    ]
)} on:stationsUpdated>
{#each addedStations as addedStation}
    <Badge text={addedStation.name}
   size="small"
   color="lightBlue"
   isClickable={moreThanOneStationAdded}
   on:click={moreThanOneStationAdded? ()=>{
        console.log("Removing station from user's list.")
        removeItemFromList(addedStation, addedStations)
        addedStations = addedStations // Required for Svelte reactivity to trigger
        announceStationsUpdate()
    }: null}
   >
        <svelte:fragment slot="text">
            <Icon icon="bi:pin-fill"/>
        </svelte:fragment>
        <!-- Do not allow the user to remove the station if only one station has been added -->
            <svelte:fragment slot="badge">
                        {#if moreThanOneStationAdded}
                    <Icon icon="charm:cross"/>
                                    {/if}
            </svelte:fragment>
    </Badge>
{/each}
<!-- Add results from the current search -->
{#if showSearchBox}
    {#each searchResults as searchResult}
        <!-- Ignore the Tekniska högskolan station -->
        {#if !addedStations.includes(searchResult) && searchResult.id !== "9204"}
        <Badge text={searchResult.name}
           size="small"
           isClickable={true}
            on:click={()=>{
                if (!addedStations.includes(searchResult)){
                    console.log("Adding station to user's list.")
                    addedStations.push(searchResult)
                    addedStations = addedStations // Required for Svelte reactivity to trigger
                    announceStationsUpdate()
                }
            }}/>
        {/if}
    {/each}
{/if}
</div>
