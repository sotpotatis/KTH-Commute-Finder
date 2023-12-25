<!-- ScheduleView.svelte
Shows the user's current schedule.
-->
<script>
	import LoadingSpinner from '../../generic/LoadingSpinner.svelte';
	import Error from '../../generic/Error.svelte';
	import { createEventDispatcher, onMount } from 'svelte';
	import APIWrapper from '../../../lib/websiteAPI/api.js';
	import { getNow } from '../../../lib/utils.js';
	import ScheduleEventCard from './ScheduleEventCard.svelte';
	import { DateTime } from 'luxon';
	import Icon from '@iconify/svelte';
	import IconButton from '../../generic/IconButton.svelte';
	import ScheduleEventCardGroup from './ScheduleEventCardGroup.svelte';
	export let scheduleURL; // Users schedule URL
	const api = new APIWrapper(); // Create API wrapper
	const dispatch = createEventDispatcher(); // ...and an event dispatcher
	const now = getNow();
	const scheduleSearchDates = {
		startDate: now.minus({ days: 21 }).toISODate(), // TODO remove this after testing period is done
		endDate: now.plus({ days: 7 }).toISODate()
	};
	$: scheduleEvents = null;
	$: scheduleEventDays = [];
	$: currentPickedDayIndex = 1; // Currently picked day in schedule events list. Note that indexes start at 1!
	$: loading = false;
	$: error = false;
	onMount(() => {
		if (scheduleURL !== null && scheduleURL !== undefined && scheduleEvents === null) {
			console.log('Loading schedule...');
			loading = true;
			error = false;
			api
				.getScheduleEvents(scheduleURL, scheduleSearchDates.startDate, scheduleSearchDates.endDate)
				.then(([requestSuccessful, responseData]) => {
					if (requestSuccessful) {
						scheduleEvents = responseData.events;
						scheduleEventDays = Object.keys(scheduleEvents);
						if (scheduleEventDays.length > 0) {
							console.log('Got schedule events!', scheduleEvents);
						} else {
							console.warn('Got no schedule events from the server!');
							error = true;
						}
					} else {
						console.error('An error occurred, the request was not successful.');
						error = true;
					}
					loading = false;
				})
				.catch((e) => {
					console.error(`An error occurred when getting schedule events :/ ${e}`);
					error = true;
				});
		}
	});
	// Create text for the current picked day
	$: currentPickedDate =
		scheduleEvents !== null
			? scheduleEventDays.length > 0
				? scheduleEventDays[currentPickedDayIndex - 1]
				: null
			: null;
	$: currentPickedDateIsToday = DateTime.fromISO(currentPickedDate) === getNow();
	$: currentScheduleEvents = currentPickedDate !== null ? scheduleEvents[currentPickedDate] : []; // Schedule event for current day
	$: currentPickedDay =
		currentPickedDate !== null ? DateTime.fromISO(currentPickedDate).setLocale('sv-se') : null;
	$: currentPickedDayText =
		currentPickedDay !== null
			? currentPickedDay.setLocale('sv-se').toFormat('EEEE, dd MMM').toLowerCase()
			: null;
	// Group schedule events, so that multiple events starting the same hour are grouped together
	$: groupedScheduleEvents = {}; // Mapping: event start hour --> list of events
	$: for (const scheduleEvent of currentScheduleEvents) {
		const eventStartHour = DateTime.fromISO(scheduleEvent.start).hour.toString();
		if (!Object.keys(groupedScheduleEvents).includes(eventStartHour)) {
			groupedScheduleEvents[eventStartHour] = [];
		}
		groupedScheduleEvents[eventStartHour].push(scheduleEvent);
	}
	console.log('Grouped events', groupedScheduleEvents);
	// Generate greeting - "good morning" etc.
	let greeting = null;
	if (now.hour > 10) {
		if (now.hour > 12) {
			if (now.hour < 18) {
				greeting = 'God eftermiddag!';
			} else {
				greeting = 'God kväll!';
			}
		} else {
			greeting = 'God förmiddag!';
		}
	} else {
		greeting = 'God morgon!';
	}
	const pickScheduleEvent = (scheduleEvent) => {
		console.log('A schedule event was picked! Dispatching picked schedule item...', scheduleEvent);
		dispatch('scheduleEventPicked', {
			scheduleEvent: scheduleEvent
		});
	};
</script>

{#if loading && !error}
	<LoadingSpinner size="big" message="Hämtar ditt schema..." />
	<p>
		<small
			>(Om detta är första gången ditt schema hämtas på ett tag, kan detta ta upp till 10 sekunder)</small
		>
	</p>
{:else if error}
	{#if scheduleEventDays.length === 0}
		<!-- If no schedule events were found -->
		<Error
			message="Inga schemaevent inom den närmsta veckan hittades. Är det tentaplugg nu måntro?"
		/>
	{:else}
		<Error message="Tyvärr, ett fel inträffade. Testa att komma tillbaka senare." />
	{/if}
	<!-- Show schedule events. -->
{:else if scheduleEvents !== null}
	<!-- Show current day -->
	<header class="text-center">
		<h2 class="text-5xl font-black">{greeting}</h2>
		<p class="text-lg pt-5">Klicka på det schemaevent som du vill söka relaterade resor för.</p>
	</header>
	<!-- Show schedule events -->
	<div class="text-left md:text-center m-12">
		<div class="flex flex-row gap-x-2">
			<!-- Add button to go to previous day -->
			{#if currentPickedDayIndex > 1}
				<IconButton
					iconName="mingcute:left-line"
					size="medium"
					on:click={() => {
						console.log('Going to previous day in schedule...');
						currentPickedDayIndex -= 1;
						groupedScheduleEvents = {}; // Reset the grouped schedule events
					}}
				/>
			{/if}
			<h2 class="text-2xl font-bold py-4">
				{!currentPickedDateIsToday ? currentPickedDayText : 'Dagens schema'}
			</h2>
			<!-- ...and add a button to next day -->
			{#if scheduleEventDays[currentPickedDayIndex] !== undefined}
				<IconButton
					iconName="mingcute:right-line"
					size="medium"
					on:click={() => {
						console.log('Going to next day in schedule...');
						currentPickedDayIndex += 1;
						groupedScheduleEvents = {}; // Reset the grouped schedule events
					}}
				/>
			{/if}
		</div>
		<div class="flex flex-col items-left justify-left md:items-center md:justify-center">
			{#each Object.values(groupedScheduleEvents) as hourScheduleEvents}
				<!-- Present the first schedule event -->
				<ScheduleEventCardGroup numberOfEvents={hourScheduleEvents.length}>
					<svelte:fragment slot="first-event">
						<ScheduleEventCard
							eventTitle={hourScheduleEvents[0].summary.title}
							eventType={hourScheduleEvents[0].summary.type}
							eventLocation={hourScheduleEvents[0].location}
							startTime={hourScheduleEvents[0].start}
							on:click={() => {
								pickScheduleEvent(hourScheduleEvents[0]);
							}}
						/>
					</svelte:fragment>
					<svelte:fragment slot="collapsible-events">
						{#each hourScheduleEvents.slice(1, hourScheduleEvents.length) as scheduleEvent}
							<ScheduleEventCard
								eventTitle={scheduleEvent.summary.title}
								eventType={scheduleEvent.summary.type}
								eventLocation={scheduleEvent.location}
								startTime={scheduleEvent.start}
								on:click={() => {
									pickScheduleEvent(scheduleEvent);
								}}
							/>
						{/each}
					</svelte:fragment>
				</ScheduleEventCardGroup>
			{/each}
		</div>
	</div>
{/if}
