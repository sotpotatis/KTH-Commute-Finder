<!-- TimePickerView.svelte
Searchs for trips and shows the available times.
-->
<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import LoadingSpinner from '../../generic/LoadingSpinner.svelte';
	import Error from '../../generic/Error.svelte';
	import APIWrapper from '../../../lib/websiteAPI/api.js';
	import TimeBadge from '../time/TimeBadge.svelte';
	import { Settings } from '../../../lib/settings.js';
	import { DateTime, Duration } from 'luxon';
	import { lastListElement, passClassList } from '../../../lib/utils.js';
	import Button from '../../generic/Button.svelte';
	import WalkTimeSetter from '../time/WalkTimeSetter.svelte';
	import TripSummary from '../trip/TripSummary.svelte';
	import { API_TRAVEL_METHOD_TYPES, PRODUCT_TYPE_TO_API_TYPE } from '../../../lib/slAPI/sl.js';
	import Icon from '@iconify/svelte';
	export let scheduleEvent; // The requested schedule event
	export let startStation;
	export let destinationRoom; // The location to search SL trips for
	// Create an API client
	const api = new APIWrapper();
	const dispatch = createEventDispatcher();
	// ...and an interface for settings
	$: settings = new Settings().getProxy();
	$: loading = false;
	$: error = false;
	$: foundTrips = [];
	$: tripsWrapper = null;
	// There are also two different ways to select trips: either by avant-garde horizontal scrolling, or classic
	// vertical scrolling.
	$: scrollModeIsHorizontal = true;
	const toggleScrollMode = (targetValue) => {
		console.log(`Changing scroll mode to ${targetValue ? 'horizontal' : 'vertical'}...`);
		scrollModeIsHorizontal = targetValue;
		scrollToAssociatedTrip();
	};
	$: scrollModeButtonColors = [
		scrollModeIsHorizontal ? 'indigo' : 'gray',
		!scrollModeIsHorizontal ? 'indigo' : 'gray'
	];
	$: selectedTrip = null;
	// If the user decided to change the walk time from what was initially set,
	// use that instead of what the API returned
	$: correctedWalkTime = null;
	$: walkTime = null;
	const getOverridenWalkingTimes = () => {
		return settings.get('overridenWalkingTimes', {});
	};
	$: lastTripPart = selectedTrip !== null ? lastListElement(selectedTrip.parts) : null; // Get the last part of the set trip
	// Handle which walk time that should be displayed to the user
	$: overridenWalkingTimes = getOverridenWalkingTimes();
	$: if (selectedTrip !== null) {
		correctedWalkTime =
			overridenWalkingTimes[
				`${lastTripPart.origin.slID}-${destinationRoom.information.location.buildingName}`
			];
		if (correctedWalkTime === undefined) {
			// If the user has not overriden the walking time
			correctedWalkTime = null;
		}
		walkTime =
			correctedWalkTime === null
				? Duration.fromISO(lastTripPart.walkTime).minutes
				: correctedWalkTime;
	} else {
		walkTime = null;
	}
	// Define function to search for a trip
	const findTrips = () => {
		console.log('Searching for trip from: ', startStation, 'to', destinationRoom);
		loading = true;
		const destinationRoomLocation = destinationRoom.information.location;
		// Get the travel methods that the user has chosen to include if they have set custom settings for it
		let includedTravelMethods = null;
		if (
			settings.avoidedTravelMethods !== undefined &&
			settings.avoidedTravelMethods !== null &&
			settings.avoidedTravelMethods.length > 0
		) {
			// Create a list of the travel methods that has not been
			// ignored
			includedTravelMethods = [];
			for (const [travelMethodKey] of Object.entries(API_TRAVEL_METHOD_TYPES)) {
				if (!settings.avoidedTravelMethods.includes(travelMethodKey)) {
					// If not ignored, add to list
					includedTravelMethods.push(travelMethodKey);
				}
			}
		}
		api
			.findTrips(
				{
					startStationId: startStation.id,
					destinationLatitude: destinationRoomLocation.latitude,
					destinationLongitude: destinationRoomLocation.longitude,
					arriveTime: scheduleEvent.start
				},
				walkTime,
				includedTravelMethods
			)
			.then(([requestSuccessful, responseData]) => {
				if (requestSuccessful) {
					console.log('Got found trip data from server!', responseData);
					loading = false;
					foundTrips = responseData.trips;
					if (foundTrips.length === 0) {
						error = true;
						console.warn('No trips were found!');
					} else {
						// Initially select the trip that arrives approximately 15 minutes before event start
						selectedTrip = foundTrips[0];
						const targetTripArrivalTime = DateTime.fromISO(scheduleEvent.start)
							.setZone('Europe/Stockholm')
							.minus({ minutes: 15 });
						for (const foundTrip of foundTrips) {
							const foundTripArrivalTime = DateTime.fromISO(
								selectedTrip.arriveAt.destination
							).setZone('Europe/Stockholm');
							if (targetTripArrivalTime >= foundTripArrivalTime) {
								console.log('Found appropriate middle trip!');
								selectedTrip = foundTrip;
							}
						}
						if (selectedTrip === foundTrips[0]) {
							console.warn("Looks like I didn't find an appropriate middle trip.");
						}
					}
				} else {
					console.warn('Request failed with response:', responseData);
					error = true;
				}
			})
			.catch((exception) => {
				console.warn('Request failed with error!', exception);
				error = true;
			});
	};
	const scrollToAssociatedTrip = () => {
		console.log('Trying to scroll to the associated trip.');
		if (tripsWrapper === null) {
			console.log("...nevermind, the trips wrapper doesn't seem to be available yet!");
			setTimeout(scrollToAssociatedTrip, 500); // Retry in 0.5 seconds
		} else {
			for (const element of tripsWrapper.children) {
				if (element.dataset.associatedtrip === JSON.stringify(selectedTrip)) {
					console.log('Found selected trip, scrolling to it...');
					// This code is from my portfolio website: https://github.com/sotpotatis/20alse.portfoliohemsida/blob/main/main.js
					// which (I think) originally credits StackOverflow (would not be surprised :))
					element.scrollIntoView({
						behavior: 'smooth',
						block: scrollModeIsHorizontal ? 'start' : 'end',
						inline: scrollModeIsHorizontal ? 'start' : 'end'
					});
				}
			}
		}
	};
	onMount(() => {
		// Load the value of the user settings from localstorage
		settings.loadFromLocalStorage();
		findTrips();
		scrollToAssociatedTrip();
	});
</script>

{#if loading && !error}
	<LoadingSpinner size="big" message="Söker resor..." />
{:else if error}
	{#if foundTrips !== null && foundTrips.length === 0}
		<Error
			message="Tyvärr, inga resor kunde hittas. Testa att komma tillbaka senare eller ändra i din sökning."
		/>
		<!-- Provide some deeper troubleshooting -->
		<div class="text-center leading-loose">
			<h2 class="font-bold">Några möjliga anledningar...</h2>
			<ul class="list-disc list-inside">
				<li><i>Är eventet ett digitalt event?</i></li>
				<li>
					<i>Ligger eventet utanför huvudcampus?</i> Exempelvis, för KTH Valhallavägen så saknas platsuppgifter
					för vissa laborationssalar som ligger i Alba Nova.
				</li>
				<li>
					Är du säker att du inte valt att söka från t.ex. en busstation, men har <i>inaktiverat</i>
					buss som färdmedel (se inställningsmenyn)
				</li>
				<li>
					Tekniska störningar hos SL, hos KTH's schema- eller platssökning, eller hos ägaren av
					denna tjänst.
				</li>
				<li>En bugg.</li>
			</ul>
		</div>
	{:else}
		<Error message="Tyvärr, ett fel inträffade. Testa att komma tillbaka senare." />
	{/if}
{:else if foundTrips !== null && selectedTrip !== null}
	<!-- Render the found walk time and allow the user to change it if needed -->
	<WalkTimeSetter
		buildingName={destinationRoom.information.location.buildingName}
		walkOrigin={lastListElement(selectedTrip.parts).origin}
		currentWalkTime={walkTime}
		on:overriddenWalkingTimeUpdated={(event) => {
			const newTime = event.detail.newTime;
			// Save overriden walking time to settings
			console.log('Saving overriden walking time to user settings...', newTime);
			// Walking times are saved under a key called "overridenWalkingTimes"
			// with the overriden walking time for each building set
			let walkingTimeSetting = {};
			const lastStationSlID = lastListElement(selectedTrip.parts).origin.slID;
			const destinationBuilding = destinationRoom.information.location.buildingName;
			walkingTimeSetting[`${lastStationSlID}-${destinationBuilding}`] = newTime;
			overridenWalkingTimes = settings.setObjectSetting(
				'overridenWalkingTimes',
				walkingTimeSetting
			);
			settings = settings;
			overridenWalkingTimes = overridenWalkingTimes;
			walkTime = newTime;
			console.log('Overriden walking time updated!', overridenWalkingTimes);
			findTrips();
		}}
	/>
	<div class="flex flex-row gap-x-2">
		<h2 class="text-2xl font-bold py-3">När vill du vara framme?</h2>
		<!-- Allow user to change the scroll mode if wanted -->
		<div class="flex flex-row gap-x-4">
			<!-- Comment: Icon button reactivity doesn't work as expected here, TODO is to fix that -->
			<Button
				color={scrollModeButtonColors[0]}
				on:click={() => {
					toggleScrollMode(true);
				}}
				extraClasses={['p-1']}
			>
				<Icon icon="ic:round-view-column" />
			</Button>
			<Button
				color={scrollModeButtonColors[1]}
				on:click={() => {
					toggleScrollMode(false);
				}}
				extraClasses={['p-1']}
			>
				<Icon icon="ph:list-fill" />
			</Button>
		</div>
	</div>
	<p>
		Skrolla {#if scrollModeIsHorizontal}åt höger eller vänster{:else}nedåt{/if} för att hitta önskad
		ankomsttid i listan nedan.
	</p>
	<!-- Render all the times for the found trips -->
	<div
		class={passClassList([
			'flex wrap-0 min-w-screen p-2 gap-x-2 gap-y-2',
			scrollModeIsHorizontal
				? 'flex-row overflow-x-scroll snap-x'
				: 'flex-col overflow-y-scroll snap-y'
		])}
		bind:this={tripsWrapper}
	>
		{#each foundTrips as foundTrip}
			<div class="snap-normal snap-center" data-associatedTrip={JSON.stringify(foundTrip)}>
				<TimeBadge
					isSelected={foundTrip === selectedTrip}
					optimizeForHorizontalScroll={scrollModeIsHorizontal}
					overridenWalkingTime={correctedWalkTime}
					tripData={foundTrip}
					scheduleEventStart={DateTime.fromISO(scheduleEvent.start)}
					on:click={() => {
						selectedTrip = foundTrip;
						console.log('Selected trip updated to: ', selectedTrip);
					}}
				/>
				<TripSummary
					tripData={foundTrip}
					iconBackground={true}
					showDestinationName={false}
					size="medium"
					showStartName={false}
				/>
			</div>
		{/each}
	</div>
	<!-- Add a button for the user to confirm the search -->
	<Button
		color="green"
		on:click={() => {
			console.log('The user picked a trip!', selectedTrip);
			dispatch('tripPicked', {
				tripData: selectedTrip
			});
		}}
	>
		Visa resa
	</Button>
{/if}
