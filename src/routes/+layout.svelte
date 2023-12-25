<script>
	import '../app.css'; // Import Tailwind CSS and other generated CSS
	import { Settings } from 'luxon';
	// Set default time zone to Swedish time zone
	Settings.defaultZone = 'Europe/Stockholm';
</script>

<svelte:head>
	<!-- SEO etc. -->
	<title>KTH Commute Finder</title>
	<meta property="og:title" content="KTH Commute Finder" />
	<meta property="og:type" content="website" />
	<meta property="og:image" content="/static/project_logo.png" />
	<meta
		property="og:description"
		content="Koppla ihop ditt KTH-schema med SL-resor och hitta den perfekta resan för dig!"
	/>
	<meta name="theme-color" content="#1b2432" />
	<!-- Include this to make the og:image larger -->
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>
<slot />
