<!-- TripSummary.svelte
Shows a summary of a trip in icons and text. -->
<script>
    import {getTripTravelMethods, lastListElement, passClassList} from "../../../lib/utils.js";
    import Icon from "@iconify/svelte";
    import {TRAVEL_METHOD_ICONS} from "../../../lib/const.js";
    export let tripData; // JSON data for the trip. A little unclean but it's easiest this way
    export let size = "medium"
    const SIZE_TO_CLASSES = {
        small: "text-sm",
        medium: "text-xl font-bold",
        big: "text-xl"
    }
    export let showStartName = true; // Whether to show start station name or not
    export let showDestinationName = true; // Whether to show destination name or not
    export let iconBackground = false; // Can be used to add a background to the travel method icons
    // Parse the trip
    $:  firstTripPart = tripData.parts[0]
    $:  lastTripPart = lastListElement(tripData.parts)
    $:  startName = firstTripPart.origin.name
    $:  destinationName = lastTripPart.origin.name
    // Get travel methods involved
    $: travelMethods = getTripTravelMethods(tripData).slice(0,4) // Limit to 3 travel methods
    const classesToApply = [SIZE_TO_CLASSES[size],
    "flex flex-row gap-x-3 p-3"]
</script>
<p class={passClassList(classesToApply)}>
    {#each travelMethods as travelMethod}
        <Icon class={
        iconBackground ? "p-1 rounded-full bg-blue-400": null
        } icon={TRAVEL_METHOD_ICONS[travelMethod]}/>
    {/each}
    <!-- Add start and destination if set -->
    {#if showStartName}
        <span>
            {startName}
        </span>
    {/if}
    {#if showDestinationName}
        <span>
            {#if showStartName}- {/if}{destinationName}
        </span>
    {/if}
</p>