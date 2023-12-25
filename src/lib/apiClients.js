/* apiClients.js
 * Sets up some API clients. */
import SL from 'sl-api';
import { SLAPIWrapper } from './slAPI/sl.js';
import { Deta } from 'deta';
import NodeCache from 'node-cache';
import fauna from 'faunadb'; // Create SL API wrapper
const { Client } = fauna;
export const slWrapper = new SL(
	{
		tripPlanner: import.meta.env.VITE_SL_TRIP_PLANNER_API_KEY,
		locationLookup: import.meta.env.VITE_SL_LOCATION_LOOKUP_API_KEY
	},
	'json'
);
export const slAPI = new SLAPIWrapper({
	reseplanerare: import.meta.env.VITE_SL_TRIP_PLANNER_API_KEY,
	platsuppslag: import.meta.env.VITE_SL_LOCATION_LOOKUP_API_KEY
});
// Create database wrapper
// Spin up database for caching in production
export let database = null;
export const DATABASE_TYPE =
	import.meta.env.VITE_DATABASE_TYPE !== undefined
		? import.meta.env.VITE_DATABASE_TYPE.toLowerCase()
		: '';
if (DATABASE_TYPE === 'deta') {
	console.log('Connecting to Deta database...');
	const deta = Deta();
	database = deta.Base(import.meta.env.VITE_DETA_DATABASE_NAME);
	console.log(`Connected to database. Caching function ready.`);
} else if (DATABASE_TYPE === 'memory') {
	console.log('Connecting to generic memory database...');
	database = new NodeCache();
	console.log('Connected to memory database.');
} else if (DATABASE_TYPE === 'fauna') {
	const faunaDBSecret = import.meta.env.VITE_FAUNADB_SERVER_SECRET;
	if (faunaDBSecret === undefined) {
		throw new Error('No fauna DB secret specified!');
	}
	database = new Client({
		secret: faunaDBSecret
	});
} else {
	console.warn(`Unknown database type "${DATABASE_TYPE}!"`);
}
