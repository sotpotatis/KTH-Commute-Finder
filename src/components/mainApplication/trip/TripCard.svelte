<!-- TripCard.svelte
Main card that visualizes a trip step. -->
<script>
	import TripSummary from './TripSummary.svelte';
	import { TRAVEL_METHOD_ICONS } from '../../../lib/const.js';
	import Button from '../../generic/Button.svelte';
	import { DateTime, Duration } from 'luxon';
	import Icon from '@iconify/svelte';
	export let partData; // Information for the part. Again, a little unclean to pass like this, but yields cleaner code in the end
	export let isLastPart;
	$: relevantTime = !isLastPart ? partData.origin.time : partData.destination.time;
	$: partType = partData.type;
	// Add icon to show the part if any is found
	$: partIcon = null;
	$: if (partType === 'publicTransport' && partData.product !== undefined) {
		partIcon = TRAVEL_METHOD_ICONS[partData.product.type.type];
	} else if (partType === 'walk') {
		partIcon = 'ic:round-directions-walk';
	}
	$: isCollapsed = true;
	$: isCollapsible =
		partType === 'publicTransport' && partData.stops !== undefined && partData.stops.length > 2;
	// Create heading and subheading
	$: partHeading = null;
	$: partSubheading = null;
	$: if (partType === 'publicTransport') {
		partHeading = partData.origin.name;
		if (partData.product !== undefined && partData.product.line !== undefined) {
			partSubheading = `Åk ${partData.product.name} mot ${partData.product.finalStation}`;
		}
	} else if (partType === 'walk') {
		partHeading = `Gå ${partData.distance} m (${Duration.fromISO(partData.walkTime).minutes} min)`;
		partSubheading = `Från ${partData.origin.name} till ${partData.destination.name}`;
	}
</script>

<div
	class="bg-gray-900/50 backdrop-blur-xl rounded-lg my-3 p-3 grid grid-cols-5 md:grid-cols-4 gap-x-8 items-center"
>
	<!-- Add time -->
	<p class="font-black text-2xl md:text-3xl">
		{DateTime.fromISO(relevantTime).toLocaleString(DateTime.TIME_24_SIMPLE)}
	</p>
	<div class="col-span-4 md:col-span-3">
		<h2 class="text-3xl font-semibold flex flex-row items-center gap-x-2">
			<!-- Add icon if set -->
			{#if partIcon !== null}
				<span class="rounded-full p-1 text-3xl bg-gray-400">
					<Icon icon={partIcon} />
				</span>
			{/if}
			{partHeading}
		</h2>
		<!-- Add subheading if set -->
		{#if partSubheading !== null}
			<h3 class="text-lg p-3">{partSubheading}</h3>
		{/if}
	</div>
</div>
<!-- Show individual stations if details are set to be shown
 (remember, only public transport steps can have their details shown!) -->
{#if !isCollapsed}
	{#each partData.stops as stopData, i}
		<p class="text-xl text-center">
			<span class="font-black px-3">
				{DateTime.fromISO(stopData.time).toLocaleString(DateTime.TIME_24_SIMPLE)}
			</span>
			{stopData.name}
			{#if i < partData.stops.length - 1}
				<!-- Add dividing space between each station -->
				{#each { length: 3 } as _, i}
					<p class="text-gray-200 opacity-80 text-sm leading-none">⦁</p>
				{/each}
			{/if}
		</p>
	{/each}
{/if}
<!-- Show button to collapse -->
{#if isCollapsible}
	<p class="text-center">
		<Button
			color="link"
			on:click={() => {
				isCollapsed = !isCollapsed;
			}}
		>
			<span class="animate-pulse text-blue-400">●</span>
			{isCollapsed ? 'Visa detaljer' : 'Göm detaljer'}
		</Button>
	</p>
{/if}
