<!-- TripDetails.svelte
Shows the trip that a user has picked, with all data and everything.-->
<script>
    import {DateTime, Duration} from "luxon";
    import {lastListElement} from "../../../lib/utils.js";
    import Badge from "../../generic/Badge.svelte";
    import TripCard from "./TripCard.svelte";
    import WarningBox from "../../generic/WarningBox.svelte";
    export let tripData; // JSON data for the currently picked trip
    // Extract data from the provided trip data
    $: totalTripDuration = Duration.fromISO(tripData.totalDuration).minutes
    $: firstTripPart = tripData.parts[0]
    $: lastTripPart = lastListElement(tripData.parts)
    $: departTime = DateTime.fromISO(firstTripPart.origin.time)
    $: arrivalTime = DateTime.fromISO(lastTripPart.destination.time)
    $: departTimeText = `Avgår ${departTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`
    $: arrivalTimeText = `Framme ${arrivalTime.toLocaleString(DateTime.TIME_24_SIMPLE)}`
    $: sortedTripMessages = tripData.messages.sort((a,b)=>{ // Sort messages based on their priority
        return b.priority - a.priority
    })
    </script>
<h1 class="text-3xl font-bold">Din resa</h1>
<!-- Show trip summary --->
<div class="flex flex-row gap-x-12 p-8">
    <!-- Add trip length -->
    <Badge size = "medium" circular={false}  flexbox={false} color="darkYellow" text={`${totalTripDuration} min`}/>
    <!-- Add trip depart time -->
    <Badge size = "medium" circular={false} color="mutedDarkBlue" text={departTimeText}/>
    <Badge size = "medium" circular={false} color="mutedGreen" text={arrivalTimeText}/>
</div>
<div class="p-8">
<!-- Add any warnings if defined -->
{#each sortedTripMessages as message}
    <WarningBox title={message.title} body={message.body}/>
{/each}
<!-- Show detailed steps for the whole trip -->
{#each tripData.parts as tripPart}
    <TripCard partData={tripPart} isLastPart={tripPart === lastTripPart}/>
{/each}
</div>