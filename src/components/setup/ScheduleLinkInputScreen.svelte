<!-- ScheduleLinkScreen
A screen that asks for the user's schedule link.
-->
<script>
	import { createEventDispatcher } from 'svelte';
	import TextInput from '../generic/TextInput.svelte';
	import APIWrapper from '../../lib/websiteAPI/api.js';
	export let filledInLink = null; // Allow passing in link from outside source
	const dispatch = createEventDispatcher(); // For dispatching the custom "schedulelink" event with a schedule link.
	const api = new APIWrapper();
	let scheduleLinkValid = null; // Tracks if a schedule link is valid or not
	// Note: there are differences between this value and the value above:
	// 1. scheduleLinkValid: if the link is valid or not, validated directly as the user is typing in the link
	// 2. scheduleLinkValidated: if the link has been detected a valid URL, validated using the API but didn't end up being valid.
	let scheduleLinkValidated = false;
	$: loading = false; // Tracks if we are checking if the schedule link is valid or not
	$: error = { occurred: false, errorMessage: null };
	$: scheduleLink = filledInLink; // Currently enterred schedule link
	$: userHasTyped = false;
</script>

<div class="flex flex-col gap-x-4 gap-y-4 justify-center">
	<h2 class="font-semibold text-lg">
		Klistra in din <a
			href="https://www.kth.se/social/home/calendar/settings/"
			target="_blank"
			class="decoration-1 underline-offset-4 underline hover:cursor-pointer">KTH-schemalänk</a
		> nedan:
	</h2>
	<TextInput
		placeholder="Din KTH-schemalänk..."
		value={scheduleLink}
		disabled={loading || scheduleLinkValid}
		{loading}
		errorMessage={scheduleLinkValid === false && scheduleLinkValidated
			? 'Ogiltig schemalänk. Försök igen.'
			: null}
		loadingMessage="Försöker hämta ditt schema..."
		error={!scheduleLinkValid && userHasTyped && !loading}
		success={scheduleLinkValid}
		on:input={(event) => {
			// On schedule link
			const newScheduleLink = event.target.value;
			userHasTyped = true;
			// Run check after a while if it looks like the user has stopped typing
			setTimeout(() => {
				if (newScheduleLink !== event.target.value) {
					console.log(`User is still typing: ${event.target.value}`);
					return;
				}
				console.log(`Got new schedule link: ${newScheduleLink}. Checking validity...`);
				scheduleLinkValidated = false;
				try {
					const scheduleLinkURL = new URL(newScheduleLink); // This will throw an error if the URL is invalid
					if (scheduleLinkURL.hostname.includes('kth')) {
						console.log(`Asking API to validate schedule link...`);
						loading = true;
						api.validateScheduleURL(newScheduleLink).then(([requestSucceded, requestData]) => {
							loading = false;
							scheduleLinkValidated = true;
							if (requestSucceded) {
								scheduleLinkValid = true;
								dispatch('schedulelink', { scheduleLink: newScheduleLink });
							} else {
								scheduleLinkValid = false;
							}
						});
					} else {
						console.log('URL does not include "KTH".');
						scheduleLinkValid = false;
						scheduleLinkValidated = true;
					}
				} catch (e) {
					console.log(`Failed to validate schedule link: is not a valid URL.`);
					scheduleLinkValid = false;
					scheduleLinkValidated = true;
				}
			}, 1000);
		}}
	></TextInput>
</div>
