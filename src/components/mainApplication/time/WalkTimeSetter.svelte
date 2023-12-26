<!-- WalkTimeSetter.svelte
Allows the user to change the walk time for a certain trip.
-->
<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import IconButton from '../../generic/IconButton.svelte';
	import { Settings } from '../../../lib/settings.js';
	export let currentWalkTime; // The currently set walking time
	export let destinationLocation; // The building that the event is related to
	export let walkOrigin; // The station that the user is travelling from
	$: editing = false; // If the walk time is being edited or not
	// Create text for the selected walk time
	$: walkTimePrefix = currentWalkTime !== 1 ? ' minuter' : ' minut';
	$: buildingName = destinationLocation.buildingName;
	$: destinationLatitude = destinationLocation.latitude;
	$: destinationLongitude = destinationLocation.longitude;

	const dispatch = createEventDispatcher();
	// Create interface for settings
	const settings = new Settings().getProxy();
	onMount(() => {
		// Load settings from local storage
		settings.loadFromLocalStorage();
	});
</script>

<h1 class="text-4xl font-bold">
	{buildingName}:
	<!-- Add edit view if set -->
	{#if editing}
		<form
			on:submit={(event) => {
				event.preventDefault();
				const formData = new FormData(event.target);
				const formProperties = Object.fromEntries(formData);
				const newTime = formProperties.newTime;
				// Alert parent that the walking time has been updated
				dispatch('overriddenWalkingTimeUpdated', { newTime: newTime });
				editing = false;
				return false;
			}}
		>
			<input
				name="newTime"
				class="bg-gray-900 w-24 hover:ring-blue-400 ring-2 hover:cursor-pointer px-3"
				type="number"
				min="0"
				value={currentWalkTime}
			/>
			<!-- Add checkmark button to mark editing as done -->
			<IconButton buttonType="submit" iconName="material-symbols:check" />
			{walkTimePrefix}
		</form>
	{:else}
		{currentWalkTime}
		{walkTimePrefix}
		<!-- Add button to start editing editing as done -->
		<IconButton
			iconName="mdi:edit"
			on:click={() => {
				editing = true;
			}}
		/>
	{/if}
	promenad
</h1>
<p class="py-3">(gå från {walkOrigin.name})</p>
<!-- Add a Google Maps link to navigate to the location that the user has chosen -->
<IconButton
	size="base"
	color="underline"
	extraClasses={['flex flex-row gap-x-2 max-w-full']}
	iconName="akar-icons:link-out"
	on:click={() => {
		window.open(
			`https://www.google.com/maps?q=${destinationLatitude},${destinationLongitude}`,
			'_blank'
		);
	}}
>
	<svelte:fragment slot="buttonContent">
		<span>Visa på karta</span>
	</svelte:fragment>
</IconButton>
