<!-- SetupScreen
Shows all the steps required to set up the commute finder, as well
as asks for details. -->
<script>
    import TitleAndDescription from "../generic/TitleAndDescription.svelte";
    import DotIndicators from "../generic/DotIndicators.svelte";
    import Button from "../generic/Button.svelte";
    import {passClassList} from "../../lib/utils.js";
    import {createEventDispatcher, onMount} from "svelte";
    import ScheduleLinkInputScreen from "./ScheduleLinkInputScreen.svelte";
    import {Settings} from "../../lib/settings.js";
    import StationInputScreen from "./StationInputScreen.svelte";
    import TravelMethodPreferencesScreen from "./TravelMethodPreferencesScreen.svelte";
    import {API_TRAVEL_METHOD_TYPES} from "../../lib/slAPI/sl.js";
    import {
        handleAvoidedTravelMethodsSetting,
        handleSavedStationsSetting, handleScheduleLinkSetting
    } from "../../lib/settingEventHandlers.js";
    $: setupStep = 1; // Track where in the setup that we are
    $: setupCheckFinished = false // Avoids flashing screen when loading
    $: settings = new Settings().getProxy()
    const SETUP_STEPS = [
        {
            id: "enter_schedule_link",
            title: "Hej!",
            description: "Du är bara några steg bort från att resa smartare och klicka mindre.",
            nextButtonLocked: (()=>{return settings == null || settings.scheduleURL === null})
        },
        {
            id: "add_stations",
            title: "Hur vill du resa?",
            description: "Lägg till den/de stationer du brukar resa ifrån.",
            nextButtonLocked: (()=>{return settings == null || settings.savedStations === null}),
            subdescription: "Du kan alltid ändra dessa inställningar senare." // I invented this term, ok?
        },
        {
            id: "select_travel_methods",
            title: "Några preferenser?",
            description: "Välj vilka färdmedel du vill resa med.",
            isSkippable: true,
            linkedSettingKey: "avoidedTravelMethods",
            settingValueOnSkip: [],

        },
        {
            id: "final_step",
            title: "Klart!",
            description: "Nu är det bara att välja schemaevent och ankomsttid så sköter hemsidan resten. 💅",
            subdescription: "Om du någonsin vill ändra dina inställningar, titta bara efter inställningsikonen i nedre högra hörnet! (💅 x2)"
        }
    ]
    const TOTAL_SETUP_STEPS = SETUP_STEPS.length // How many setup steps that there are
    $: activeSetupScreen = SETUP_STEPS[setupStep-1]
    $: isLastSetupStep = setupStep === TOTAL_SETUP_STEPS
    // For whether to "lock" the next button or not, a function can optionally be defined to check that.
    // This is to avoid for example going back in the settings menu and getting stuck in a "lock trap"
    $: nextButtonLocked = activeSetupScreen.nextButtonLocked !== undefined ? activeSetupScreen.nextButtonLocked() : !activeSetupScreen.isSkippable && setupStep !== SETUP_STEPS.length

    const dispatch = createEventDispatcher() // So we can dispatch event for when setup is done
    // Create functions
    const DISPATCH_FINAL_STEP_DONE = () => { // For dispatching final step
        console.log("Dispatching that the final step is done.")
        dispatch("setupDone")
    }
    const NEXT_STEP = () => {
        if (nextButtonLocked){ // Prevent lock from changing screen
            return
        }
        if (setupStep < TOTAL_SETUP_STEPS){
            console.log("Going to the next step...")
            setupStep += 1
        }
        else {
            throw new Error("Will not go to the next step - you are already at the last step! Please use the DISPATCH_FINAL_STEP_DONE function instead.")
        }
    }
    const PREVIOUS_STEP = () => {
        if (setupStep > 1){
            console.log("Going to the previous step...")
            setupStep -= 1
        }
        else {
            throw new Error("Will not go to the previous step - you are already at the first step!")
        }
    }
    onMount(()=>{
        // Detect what setup step to do when localstorage is available (i.e. when the component has loaded)
        // (for example in case of the user aborted setup midway)
            settings.loadFromLocalStorage()
           if (settings !== null && settings.scheduleURL !== null){
                console.log("Schedule URL has been set.")
                setupStep += 1
                if (settings.savedStations !== null){
                    console.log("Saved stations has been set.")
                    setupStep += 1
                    if (settings.avoidedTravelMethods !== null){// If we get here, we are done with setup
                        console.log("All settings have been set.")
                        DISPATCH_FINAL_STEP_DONE()
                    }
                }
            }
            setupCheckFinished = true // Variable used to avoid showing setup screen when loading
            }
        )

</script>
<!-- Render the active setup screen.-->
{#if setupCheckFinished}
<!-- Render the main title
(Note: any undefined parameters will automatically not be included,
see the defaults in the TitleAndDescription component -->
<TitleAndDescription title={activeSetupScreen.title}
                     subtitle={activeSetupScreen.subtitle}
                     description={activeSetupScreen.description}
                    subdescription={activeSetupScreen.subdescription}/>
<!-- Render the active screen -->
{#if activeSetupScreen.id === "enter_schedule_link"}
    <ScheduleLinkInputScreen filledInLink={settings.scheduleURL} on:schedulelink={(event)=>{
    handleScheduleLinkSetting(event, settings)
       nextButtonLocked = false
    }}/>
{/if}
{#if activeSetupScreen.id === "add_stations"}
    <StationInputScreen stations={settings.savedStations !== null? settings.savedStations : []} on:stationsUpdated={(event)=>{
        const newStationsData = handleSavedStationsSetting(event, settings)
        nextButtonLocked = !(newStationsData.length > 0)
    }}/>
{/if}
{#if activeSetupScreen.id === "select_travel_methods"}
    <TravelMethodPreferencesScreen avoidedTravelMethods={settings.avoidedTravelMethods !== null ? settings.avoidedTravelMethods: []} on:avoidedTravelMethodsUpdated={(event)=>{
        nextButtonLocked =  handleAvoidedTravelMethodsSetting(event, settings) === null // Function returns null if the change was not permitted
        settings = settings
    }}/>
{/if}
<div class={passClassList([
    "grid",
    "gap-x-2",
    setupStep > 1 ? "grid-cols-2": "grid-cols-1"
])}>
<!-- Add back button if applicable -->
{#if setupStep > 1}
    <Button color="blue" size="medium" on:click={PREVIOUS_STEP}>Tillbaka</Button>
{/if}
<!-- Add button for next step -->
<Button color="green" size="medium" disabled={nextButtonLocked} on:click={!isLastSetupStep ? NEXT_STEP: DISPATCH_FINAL_STEP_DONE}>{isLastSetupStep ? "Klar": "Nästa"}</Button>
</div>
<!-- Add skip button if applicable -->
{#if activeSetupScreen.isSkippable}
    <Button color="link" size="small" on:click={()=>{
        // Allow setting a value for the setting that the screen is related to on skip
        if (activeSetupScreen.linkedSettingKey !== undefined){
            // Value on skip can be customized, default is null
            const settingsValueOnSkip = activeSetupScreen.settingValueOnSkip !== undefined ? activeSetupScreen.settingValueOnSkip : null
            settings.setSetting(activeSetupScreen.linkedSettingKey, settingsValueOnSkip)
        }
        NEXT_STEP()}
        }>Skippa</Button>
{/if}
<!-- Show dot indicators -->
<DotIndicators numberOfDots={TOTAL_SETUP_STEPS} currentlyActiveDot={setupStep}/>
{/if}