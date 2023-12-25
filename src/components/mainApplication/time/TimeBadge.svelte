<!-- TimeBadge.svelte
A badge that shows a time for the time picker.
-->
<script>
	import Icon from '@iconify/svelte';
	import TextAndWarning from '../../generic/TextAndWarning.svelte';
	import { lastListElement, passClassList } from '../../../lib/utils.js';
	import { createEventDispatcher } from 'svelte';
	import { DateTime } from 'luxon';
	import IconPopup from '../../generic/IconPopup.svelte';
	import IconButton from '../../generic/IconButton.svelte';
	import Popup from '../../generic/Popup.svelte';
	export let tripData; // The trip data that is associated with the badge.
	export let isSelected;
	export let optimizeForHorizontalScroll; // Optimize for two scrolling modes
	export let scheduleEventStart; // When the schedule event starts as a luxon.DateTime instance.
	export let overridenWalkingTime = null; // Walking time set by/overriden by the user, if any
	// NOTE: it is not ideal to parse the trip data in this component, but the rendering template
	// code would be very messy otherwise. A TODO could be to clean it up if needed.
	// Parse the last step of the trip, where we're arriving!
	let lastTripStep = lastListElement(tripData.parts);
	const destinationStationArrival = DateTime.fromISO(lastTripStep.origin.time); // When we arrive to the destination station
	let destinationArrival = null; // When we arrive to the destination location (the building that the schedule event is in)
	if (overridenWalkingTime === null) {
		destinationArrival = DateTime.fromISO(lastTripStep.destination.time);
	} else {
		// Use user-specified walking time if defined
		destinationArrival = destinationStationArrival.plus({ minutes: overridenWalkingTime });
	}
	if (destinationArrival !== null) {
		destinationArrival.setZone('Europe/Stockholm');
	}
	// Can be used to show warnings if the time is after
	// the event start time
	$: isAfterStartTime = destinationArrival > scheduleEventStart.plus({ minutes: 15 });
	$: isAq = !isAfterStartTime && destinationArrival > scheduleEventStart;
	// Generate classes to apply
	$: classesToApply = [
		'font-bold text-white px-3 text-3xl py-1 rounded-lg hover:cursor-pointer hover:opacity-75',
		isSelected ? 'bg-purple-600' : 'bg-gray-600',
		!optimizeForHorizontalScroll ? 'w-2/3' : 'w-full'
	];
	// Create event dispatcher
	const dispatch = createEventDispatcher();
	$: showPopup = false; // Needed to pass this down since we have nested elements
</script>

<div class="relative">
	<!-- Ensures working Svelte reactivity: really weird and quite unclean to do this, but it works :) -->
	<span class="hidden">{optimizeForHorizontalScroll}</span>
	<button class={passClassList(classesToApply)} on:click>
		{destinationArrival.toLocaleString(DateTime.TIME_24_SIMPLE)}
	</button>
	<!-- Add warnings -->
	{#if isAfterStartTime || isAq}
		<!-- Add a button and a popup for the two possible warnings -->
		<IconButton
			backgroundColor={isAq ? 'yellow' : 'red'}
			iconName={isAq ? 'mdi:clock-warning' : 'mdi:clock-remove'}
			on:click={() => {
				showPopup = true;
			}}
			size="base"
			extraClasses={[
				optimizeForHorizontalScroll ? 'absolute bottom-[-2em] right-0 ' : 'block mt-3 mx-3',
				'rounded-full ring-2 text-white'
			]}
		/>
		<!-- Show popup with information -->
		{#if showPopup}
			<Popup
				showPopup={true}
				on:popupClosed={() => {
					console.log('Closing popup...');
					showPopup = !showPopup;
				}}
			>
				<svelte:fragment slot="popup-header">
					{#if isAq}
						Akademisk kvart
					{:else}
						Efter starttid
					{/if}
				</svelte:fragment>
				<svelte:fragment slot="popup-body">
					{#if isAq}
						<p>
							Denna ankomsttid är under den <i>akademisk kvarten</i> (föreläsningar, övningar etc. är
							utsatta att börja på heltimme i schemat, men börjar i själva verket kvart över). Försäkra
							dig om att detta schemaevent verkligen har akademisk kvart!
						</p>
						<p>Akademisk kvart gäller <b>INTE</b> på tentor och liknande!</p>
					{:else}
						<p>
							Denna ankomsttid är efter schemaeventet börjar, inklusive akademisk kvart. Med andra
							ord, du kommer med största sannolikhet för sent om du tar denna resa!
						</p>
					{/if}
				</svelte:fragment>
			</Popup>
		{/if}
	{/if}
</div>
