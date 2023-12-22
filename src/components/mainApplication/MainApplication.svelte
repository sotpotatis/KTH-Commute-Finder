<!-- MainApplication.svelte
Includes code for the main application - getting your schedule and then suggested trips.
-->
<script>
    import {Settings} from "../../lib/settings.js";
    import Button from "../generic/Button.svelte";
    import ScheduleView from "./schedule/ScheduleView.svelte";
    import LocationSelectionView from "./schedule/LocationSelectionView.svelte";
    import TimePickerView from "./schedule/TimePickerView.svelte";
    import StationPickerView from "./schedule/StationPickerView.svelte";
    import TripDetailsView from "./trip/TripDetailsView.svelte";
    import SettingsButton from "../settings/SettingsButton.svelte";
    import SettingsView from "../settings/SettingsView.svelte";
    const SCHEDULE_VIEW_STEP_NUMBER = 1
    const LOCATION_SELECTOR_STEP_NUMBER = 2
    const STATION_SELECTOR_STEP_NUMBER = 3
    const TIME_PICKER_STEP_NUMBER = 4
    const TRIP_DETAILS_STEP_NUMBER = 5
    $: settings = new Settings().getProxy()
    $: currentStep = 1; // Track where in the application that we are
    $: settingsMenuActive = false // Tracks if the fullscreen settings menu is opened
    $: selectedScheduleEvent = null // The schedule event that the user is exploring
    // The locations that the user have selected - start station and origin station
    // (the latter is related to the schedule items)
    $: selectedStart = null
    $: selectedDestination = null
    $: selectedTrip = null
    $: currentEventHasMultipleRooms =  null
    const previousStep = ()=>{ // Define a function to go to the previous step
        if (currentStep <= 1){
            currentStep = 1
        }
        // Ensure that the user can not go back to the room picker if the event has just one room
        if (currentEventHasMultipleRooms || currentStep !== 3){
        currentStep -= 1
            }
        else {
            currentStep -= 2
        }
        // Reset variables
        if (currentStep < TRIP_DETAILS_STEP_NUMBER){
            selectedTrip = null
            if (currentStep < STATION_SELECTOR_STEP_NUMBER){
                selectedStart = null
            }
            if (currentStep < LOCATION_SELECTOR_STEP_NUMBER){
                selectedScheduleEvent = null
                currentEventHasMultipleRooms =  null
                selectedDestination = null
            }
        }
    }
</script>
{#if settingsMenuActive === false}
<!-- Show a back button if applicable -->
{#if currentStep > 1}
    <Button color="blue" size="medium" on:click={previousStep}>Tillbaka</Button>
{/if}
<!-- Load and show schedule -->
{#if currentStep === 1}
    <ScheduleView scheduleURL={settings.scheduleURL} on:scheduleEventPicked={(event)=>{
        // Receive when a schedule item has been picked and save that information
        // so we can pass it on to the LocationSelectorView if needed.
        selectedScheduleEvent = event.detail.scheduleEvent
        console.log("Received a selected schedule event!", selectedScheduleEvent)
        currentEventHasMultipleRooms = selectedScheduleEvent.location.rooms.length > 1
        currentStep += 1 // (even one room is handled by this step)
    }}/>
<!-- Ask what location to go to -->
{:else if currentStep === 2}
    <LocationSelectionView scheduleEvent={selectedScheduleEvent} on:locationPicked={(event)=>{
        selectedDestination = event.detail.location
        console.log(`The user has picked a location!`, selectedDestination)
        currentStep += 1 // Ask what station to travel from
    }}/>
<!-- Pick station to travel from -->
{:else if currentStep === 3}
<StationPickerView on:stationPicked={(event)=>{
    selectedStart = event.detail.location
    console.log("The user has picked a start location!", selectedStart)
    currentStep += 1 // Start the trip search
}}/>
<!-- Pick trip -->
{:else if currentStep === 4}
    <TimePickerView startStation={selectedStart} scheduleEvent={selectedScheduleEvent} destinationRoom={selectedDestination}
    on:tripPicked={(event)=>{
        selectedTrip = event.detail.tripData
        console.log("The user has picked a trip!", selectedTrip)
        currentStep += 1
    }}/>
<!-- Visualize current trip -->
{:else if currentStep === 5}
    <TripDetailsView
    tripData={selectedTrip}/>
{/if}
    <SettingsButton on:settingsButtonClicked={()=>{settingsMenuActive=true}}/>
{:else}
<!-- Show current settings if added -->
    <SettingsView on:settingsViewClosed={()=>{settingsMenuActive=false}}/>
{/if}