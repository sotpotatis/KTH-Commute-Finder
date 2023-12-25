<!-- TitleAndDescription.svelte
A title/subtitle/description system.
-->
<script>
	export let title;
	export let subtitle = null;
	export let description = null;
	export let subdescription = null;
</script>

<h1 class="text-4xl font-bold">{title}</h1>
<!-- Add optional elements -->
{#if subtitle !== null && subtitle !== undefined}
	<h2 class="text-2xl font-bold">{subtitle}</h2>
{/if}
{#if description != null && description !== undefined}
	<p class="text-lg">{description}</p>
{/if}
{#if subdescription != null && description !== undefined}
	<p class="text-base">{subdescription}</p>
{/if}
