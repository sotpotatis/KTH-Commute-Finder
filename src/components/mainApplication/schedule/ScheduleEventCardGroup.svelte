<!-- ScheduleEventCardGroup.svelte
Allows grouping multiple schedule events together.
This will make them stack, and only show the topmost until the stack is collapsed. -->
<script>
	import { passClassList } from '../../../lib/utils.js';
	export let numberOfEvents;
	$: isCollapsed = true;
</script>

<div class="text-center">
	<div class="z-20">
		<slot name="first-event" />
	</div>
	<!-- Add hinting button if the text is not collapsed -->
	{#if numberOfEvents > 1}
		<button
			class="text-white font-bold"
			on:click={() => {
				isCollapsed = !isCollapsed;
			}}
			><span class="animate-pulse text-orange-400">●</span>
			{isCollapsed
				? `+${numberOfEvents - 1} ${numberOfEvents > 2 ? 'händelser' : 'händelse'}`
				: 'Gruppera händelser'}</button
		>
	{/if}
	<div class={passClassList([isCollapsed ? 'hidden' : 'flex flex-col'])}>
		<slot name="collapsible-events" />
	</div>
</div>
