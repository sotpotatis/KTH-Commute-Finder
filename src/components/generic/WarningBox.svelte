<!-- WarningBox.svelte
A clear, narrated warning box. -->
<script>
	// Texts to set
	import Icon from '@iconify/svelte';
	import IconButton from './IconButton.svelte';
	export let title;
	export let body;
	$: isHidden = false;
</script>

{#if !isHidden}
	<figure class="bg-orange-500 rounded-lg my-3 py-3">
		<div class="flex flex-row gap-x-4 items-center">
			<!--Add close button -->
			<div class="relative text-lg top-0 p-3">
				<IconButton
					size="small"
					iconName="gridicons:cross"
					on:click={() => {
						isHidden = true;
					}}
				/>
			</div>
			<div class="text-5xl font-bold">
				<Icon icon="mingcute:warning-fill" />
			</div>
			<!-- Add title and body text -->
			<div>
				<h2 class="font-bold text-xl">{title}</h2>
				<p>{body}</p>
			</div>
		</div>
	</figure>
{/if}
