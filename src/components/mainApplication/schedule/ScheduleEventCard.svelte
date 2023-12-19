<!-- ScheduleEventCard.svelte
A card that renders a schedule event nicely.
-->
<script>
    import {DateTime} from "luxon";
    import {passClassList} from "../../../lib/utils.js";
    import IconButton from "../../generic/IconButton.svelte";
    import Icon from "@iconify/svelte";

    export let eventTitle;
    export let eventType;
    export let startTime;
    export let eventLocation;
    $: isDisabled = eventLocation === null; // Make element not clickable if the event is missing a location
    // Parse start time text
    $: parsedStartTimeText = DateTime.fromISO(startTime).setZone("Europe/Stockholm").toLocaleString(DateTime.TIME_24_SIMPLE)
    // ...event type is given as a dictionary with all the data. Parse it below.
    $: parsedEventTypeText = eventType !== null ? eventType.text.swedish: ""
    // Add a little color flair depending on type
    const EVENT_TYPE_TO_COLOR_FLAIR_CLASSES = {
        lab: "text-sky-500",
        practise: "text-yellow-500",
        lecture: "text-violet-500",
        seminar: "text-teal-500",
        helpSession: "text-blue-500",
        partialExam: "text-orange-500",
        examination: "text-red-500",
        presentation: "text-fuchsia-400"
    }
</script>
<button class={passClassList(["bg-gray-900/50 hover:bg-gray-900/30 backdrop-blur-xl hover:skew-y-[-1deg] w-72  rounded-lg py-1 my-6 px-3 mx-3 text-white",
eventLocation !== null ? "hover:cursor-pointer": "hover:cursor-not-allowed"
]
)} on:click>
    <div>
    <!-- Title -->
    <h2 class="font-black text-2xl">
        <!-- Start time -->
        {parsedStartTimeText}
        <!-- Add some whitespace -->
        <span class="px-3"></span>
        <!-- Event type (if given) -->
        {parsedEventTypeText}
        <!-- Add small flair if event type is available -->
        {#if eventType !== null}
        <span data-event-type={eventType.id} class={passClassList([EVENT_TYPE_TO_COLOR_FLAIR_CLASSES[eventType.id],
        "text-base md:text-2xl"])}>
            ●
        </span>
        {/if}
    </h2>
    <!-- Subtitle: event name/title -->
    <h3 class="text-lg">
        {eventTitle}
    </h3>
    </div>
<!-- Alert the user if the location can not be found for an event -->
{#if isDisabled}
    <p class="font-bold flex flex-row text-sm gap-x-2 items-center py-3"><Icon icon="material-symbols:warning"/>Plats kunde inte hittas. Sök resa manuellt.</p>
{/if}
</button>
