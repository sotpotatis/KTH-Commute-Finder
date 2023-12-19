<!-- TravelMethodPreferencesScreen.svelte
A part of the setup where the user selects what travel methods that they would like. -->
<script>
    import {createEventDispatcher} from "svelte";
    import {API_TRAVEL_METHOD_TYPES} from "../../lib/slAPI/sl.js";
    import {TRAVEL_METHOD_ICONS} from "../../lib/const.js";
    import Button from "../generic/Button.svelte";
    import Icon from "@iconify/svelte";
    import {removeItemFromList} from "../../lib/utils.js";
    // Create a dispatcher for when travel method preferences are updated
    const dispatch = createEventDispatcher()
    export let avoidedTravelMethods;
    export let compactMode = false; // Can be set to true to reduce the space of items
    // Create a helper function to check if a travel method ID has been set to be avoided
    $: travelMethodIsAvoided = (travelMethodId) =>{
        return avoidedTravelMethods.includes(travelMethodId)
    }
    // Check if all except one travel method has been disabled
    $: onlyOneTravelMethodAvailable = avoidedTravelMethods.length === Object.keys(API_TRAVEL_METHOD_TYPES).length -1
</script>
{#each Object.entries(API_TRAVEL_METHOD_TYPES) as [travelMethodId, travelMethodInfo]}
    {@const isAvoided = travelMethodIsAvoided(travelMethodId)}
    <Button extraClasses={
    isAvoided ?
    ["line-through"]: null} size={!compactMode ? "big":  "medium"} multipleItems={true} circular={true} color={
    isAvoided ? "gray": "blue"
    }
    on:click={!onlyOneTravelMethodAvailable || isAvoided ? ()=>{
        // Add or remove travel method from list of enabled travel methods
        if (travelMethodIsAvoided(travelMethodId)){
            removeItemFromList(travelMethodId, avoidedTravelMethods)
        }
        else if (!avoidedTravelMethods.includes(travelMethodId)) {
            avoidedTravelMethods.push(travelMethodId)
        }
        dispatch("avoidedTravelMethodsUpdated", {avoidedTravelMethods: avoidedTravelMethods})
    }: null}
    >
        <!-- Add "checkmark" indicator icon if the travel method type has not been avoided -->
        <Icon icon={!travelMethodIsAvoided(travelMethodId) ? "icon-park-solid:check-one": "icon-park-solid:close-one"}/>
        <Icon icon={TRAVEL_METHOD_ICONS[travelMethodId]}/>
        {travelMethodInfo.name.swedish}</Button>
{/each}