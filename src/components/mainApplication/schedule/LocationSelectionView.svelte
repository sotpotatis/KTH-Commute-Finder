<!-- LocationSelectionView.svelte
In the event that a schedule has multiple locations, the LocationSelectionView comes in handy and helps
with selecting the location that the user wants to go to.
-->
<script>
	import { createEventDispatcher, onMount } from 'svelte';
	import Button from '../../generic/Button.svelte';
	import Badge from '../../generic/Badge.svelte';
	import Icon from '@iconify/svelte';
	import TextAndWarning from '../../generic/TextAndWarning.svelte';
	export let scheduleEvent; // Data for the selected schedule event
	const dispatch = createEventDispatcher();
	$: availableRooms = scheduleEvent.location.rooms;
	// We have a warning if data is not available/parseable for a room.
	$: dataNotAvailableForRooms = 0;
	$: for (const roomData of availableRooms) {
		if (!roomData.dataAvailable) {
			dataNotAvailableForRooms += 1;
		}
	}
	$: dataNotAvailableForARoom = dataNotAvailableForRooms > 0;
	$: dataNotAvailableForAnyRoom = dataNotAvailableForRooms === availableRooms.length;
	// Function that can be called when a room has been picked
	const roomPicked = (roomData) => {
		console.log('Room picked. Dispatching event...', roomData);
		dispatch('locationPicked', { location: roomData });
	};
	onMount(() => {
		if (availableRooms.length === 1 && !dataNotAvailableForAnyRoom) {
			// Automagically move forward if the event only has one room
			// and it is available
			roomPicked(availableRooms[0]);
		}
	});
</script>

{#if availableRooms.length > 1}
	<h1 class="text-3xl font-bold py-3">Vilket rum?</h1>
	<p>Detta schema-event har flera rum. Vilket vill du vara i?</p>
	<p class="text-small">
		Osäker? Välj bara ett godtyckligt rum som ligger i den byggnad som du vill gå till.
	</p>
{/if}
{#if dataNotAvailableForAnyRoom}
	<!-- Show if no locations could be found -->
	<TextAndWarning>Plats kunde inte hittas för eventets rum</TextAndWarning>
	<p class="text-sm">
		Du behöver tyvärr söka din resa manuellt. Detta kan inträffa exempelvis om du har ett
		schemaevent som inte ligger på huvudcampus. För Campus Valhallavägen, så kan t.ex. laborationer
		vid Alba Nova trigga detta fel.
	</p>
{:else if dataNotAvailableForARoom}
	<!-- Show if a location could not be found for the room -->
	<TextAndWarning>Plats kunde inte hittas för ett eller flera rum</TextAndWarning>
	<p class="text-sm">
		Plats kunde inte hittas för ett eller flera rum. Sök din resa manuellt för dessa. De har
		markerats med <b>grå</b> bakgrund.
	</p>
{/if}
<div class="grid grid-cols-3 md:grid-cols-5 text-center py-3">
	{#each availableRooms as roomData}
		<div>
			{#if roomData.information !== null}
				<Badge
					color={roomData.dataAvailable ? 'purple' : 'gray'}
					isClickable={true}
					isDisabled={!roomData.dataAvailable}
					on:click={roomData.dataAvailable
						? () => {
								roomPicked(roomData);
						  }
						: undefined}
					text={roomData.information.roomName}
				></Badge>
			{/if}
		</div>
	{/each}
</div>
