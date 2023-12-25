<!-- Starting page
This page checks if the user has saved a KTH calendar in their localStorage.
If they have, they get redirected to the landing page (see landing).
If not, they get asked to add a KTH calendar link
-->
<script>
	import SetupScreen from '../components/setup/SetupScreen.svelte';
	import MainApplication from '../components/mainApplication/MainApplication.svelte';
	let setupDone = false;
</script>

{#if !setupDone}
	<main class="flex flex-col text-center items-center justify-center gap-y-6">
		<SetupScreen
			on:setupDone={() => {
				console.log('Setup has been finished!');
				setupDone = true;
			}}
		/>
	</main>
{:else}
	<main class="">
		<MainApplication />
	</main>
{/if}
