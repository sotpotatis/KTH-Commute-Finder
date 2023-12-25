/* /api/sl/findStation
API for searching for the ID of SL stations. */
import {
	API_STATUS_ERROR,
	API_STATUS_OK,
	generateResponse,
	MISSING_REQUIRED_ARGUMENTS,
	validateURLParameters
} from '../../utilities.js';
import { page } from '$app/stores';
import { slAPI, slWrapper } from '../../../../lib/apiClients.js';
export async function GET({ request }) {
	console.log('Got a request to find an SL station.');
	const [urlParametersValid, urlParameters] = validateURLParameters(['query'], request);
	if (urlParametersValid) {
		console.log('Searching...');
		try {
			const searchResults = await slAPI.platsuppslag(urlParameters.get('query'), true);
			console.log('SL API returned search results:', searchResults);
			if (searchResults.StatusCode !== 0) {
				// 0 means that the request succeeded (apparently)
				const errorMessage = `Unexpected status code from SL API: ${searchResults.statusCode}`;
				throw new Error(errorMessage);
			}
			// Convert response to more Albin-friendly output
			const foundStations = [];
			for (const foundStation of searchResults.ResponseData) {
				if (foundStation.Type === 'Station') {
					foundStations.push({
						name: foundStation.Name,
						id: foundStation.SiteId,
						location: {
							x: foundStation.X,
							y: foundStation.Y
						}
					});
				} else {
					// Since the SL API defaults to stations only, this is unexpected
					console.warn(
						`SL API returned an entry with a type that was not "Station": ${JSON.stringify(
							foundStation
						)}.`
					);
				}
			}
			return generateResponse(API_STATUS_OK, { foundStations: foundStations });
		} catch (e) {
			console.warn(`SL searched failed: an error occurred. ${e}. Returning error...`);
			return generateResponse(
				API_STATUS_ERROR,
				{
					message: 'The SL API request failed. It is possible that the SL servers are down.'
				},
				503
			);
		}
	} else {
		console.log('Bad request. Returning error...');
		return MISSING_REQUIRED_ARGUMENTS();
	}
}
