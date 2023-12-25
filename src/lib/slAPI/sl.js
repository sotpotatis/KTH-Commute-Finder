/* sl.js
API wrapper around the SL APIs Reseplanerare and Platsuppslag. */
import {
	POINT_TYPE_VIA,
	POINT_TYPE_DESTINATION,
	POINT_TYPE_ORIGIN,
	POINT_TYPE_AVOID
} from './reseplanerareClasses.js';
export const PRODUCT_TYPE_TO_API_TYPE = {
	// Convert SL product types to a format that I like better
	MET: {
		type: 'metro',
		slNumber: 2, // Number for using when filtering trips, see "Products" key under SL route planner API
		name: {
			swedish: 'Tunnelbana',
			english: 'Metro'
		}
	},
	BUS: {
		type: 'bus',
		slNumber: 8, // See above
		name: {
			swedish: 'Buss',
			english: 'Bus'
		}
	},
	TRN: {
		type: 'commuterTrain',
		slNumber: 1, // See above
		name: {
			swedish: 'Pendeltåg',
			english: 'Commuter train'
		}
	},
	TRM: {
		type: 'lightRail',
		slNumber: 4, // See above
		name: {
			swedish: 'Roslagsbanan',
			english: 'Light rail'
		}
	},
	SHP: {
		type: 'ship',
		slNumber: 64, // See above
		name: {
			swedish: 'Båt',
			english: 'Ship'
		}
	}
};
// Create a mapping lookup of the type key instead
export let API_TRAVEL_METHOD_TYPES = {};
for (const apiTravelMethod of Object.values(PRODUCT_TYPE_TO_API_TYPE)) {
	API_TRAVEL_METHOD_TYPES[apiTravelMethod.type] = apiTravelMethod;
}
// Define error
export class NoTripsFoundError extends Error {
	constructor(message) {
		if (message === undefined) {
			message = 'No trips were found with your search parameters! Please try another search.';
		}
		super(message);
		this.name = 'NoTripsFoundError';
	}
}
export class SLAPIWrapper {
	API_SERVICES = ['reseplanerare', 'platsuppslag'];
	/**
	 * Creates an instance of the SL API.
	 * @param apiKeys The API key for the API services that you want to use. For example:
	 * {reseplanerare: "<API KEY>", platsuppslag: "<ANOTHER API KEY>"}
	 * @param userAgent A user agent to identify yourself towards SL's servers. Be nice and
	 * make it easy for them to identify who is sending what!
	 */
	constructor(apiKeys, userAgent) {
		// Save provided API keys
		this.apiKeys = apiKeys;
		this.userAgent = userAgent;
	}
	/**
	 * Sends a request.
	 * @param apiKey The API key to use in the request. Can be an unverified key of this.apiKeys
	 * - the function will check for existence and alert the user if something is wrong.
	 * @param apiService The API service to call. Relative to https://api.sl.se/api2/ in the URL, minus format extension.
	 * For example, for https://api.sl.se/api2/TravelplannerV3_1/trips.json, pass "TravelplannerV3_1/trips".
	 * @param urlParameters Any URL paramteters to send.
	 * @return {Promise<any>} The JSON of the response.
	 */
	async sendRequest(apiKey, apiService, urlParameters) {
		// Check if the API key is set by the user.
		if (apiKey === undefined) {
			throw new Error("You have not defined an API key for the service that you're trying to use.");
		}
		if (urlParameters === undefined || urlParameters === null) {
			urlParameters = {};
		}
		urlParameters.key = apiKey; // Add API key to URL parameters
		// Construct URL
		let baseURL = 'https://api.sl.se/api2';
		if (apiService === 'lookahead') {
			// The lookahead service has migrated to a new URL. Use that.
			baseURL = 'https://journeyplanner.integration.sl.se/v1/typeahead';
		}
		const url = `${baseURL}/${apiService}.json?` + new URLSearchParams(urlParameters).toString();
		const response = await fetch(url, { headers: { 'User-Agent': this.userAgent } });
		return await response.json();
	}

	/**
	 * Adds optional URL parameters if they are defined (not null or undefined) to an already existing set
	 * of URL parameters.
	 * @param previousURLParameters An already existing set (object)
	 * of URL parameters.
	 * @param urlParameterSettings URL parameters in the format {parameter_name: value} (where value has not neccessarily
	 * been checked for existence by you already, hence you want to call this function)
	 * @param convertBoolToInt If true, converts any booleans to integers (1 or 0). Default is null (do not perform this conversion).
	 */
	addURLParametersIfDefined(previousURLParameters, urlParameterSettings, convertBoolToInt = null) {
		// Iterate over all possible URL parameters and add any defined ones.
		for (const [urlParameter, urlParameterValue] of Object.entries(urlParameterSettings)) {
			if (urlParameterValue !== null && urlParameterValue !== undefined) {
				// We need to convert the URL parameter value in a special case.
				let finalUrlParameterValue = urlParameterValue;
				if (typeof urlParameterValue === 'boolean' && convertBoolToInt === true) {
					finalUrlParameterValue = this._bool_to_int(urlParameterValue);
				}
				previousURLParameters[urlParameter] = finalUrlParameterValue;
			}
		}
		return previousURLParameters;
	}
	/**
	 * Sends a request to the SL Platsuppslag API to try to find a location.
	 * @param query The search query to send to the API.
	 * @param stationsOnly If true, include only stations.
	 * @param maxResults Max results to from the API.
	 * @return {Promise<*>} Await me and you will (hopefully) get a JSON response from the API.
	 */
	async platsuppslag(query, stationsOnly = null, maxResults = null) {
		// Add URL parameters if defined
		let urlParameters = { searchstring: query };
		urlParameters = this.addURLParametersIfDefined(urlParameters, {
			stationsonly: stationsOnly,
			maxresults: maxResults
		});
		const responseJSON = await this.sendRequest(
			this.apiKeys.platsuppslag,
			'typeahead',
			urlParameters
		);
		// You can get a 200 even if you get an error, interesting...
		if (responseJSON.StatusCode !== 0) {
			// Look for an error message
			const APIErrorMessage =
				responseJSON.Message !== undefined
					? responseJSON.Message
					: 'The API did not provide an error message.';
			throw new Error(`Something went wrong when requesting the SL API. Status code: ${responseJSON.StatusCode}.
            ${APIErrorMessage}`);
		}
		return responseJSON;
	}

	/**
	 * Calculates the sum of the elements in an array.
	 * @param input The array to sum.
	 * @return {*} The sum of all the elements in the array
	 * @private
	 */
	_sumArray(input) {
		return input.reduce((a, b) => {
			a + b;
		}, 0);
	}

	/**
	 * "Converts" a boolean to an integer representation (0 or 1)
	 * @param input The input.
	 * @return {number} 1 if the boolean is true, otherwise 0.
	 * @private
	 */
	_bool_to_int(input) {
		return input === true ? 1 : 0;
	}
	/**
	 * Sends a request to the SL reseplanerare API
	 * @param includedPoints A list of points that you are navigating between. Available types
	 * are instances of the Station and Coordinate classes.
	 * @param searchDate The date to search trips for (a string). Default is null (current time).
	 * @param searchTime The time to search trips for (a string). Default is null (current time).
	 * @param tripsBeforeStartTime The number of trips to suggest before the start time. Default is 0.
	 * @param tripsAfterStartTime The number of trips to suggest after the start time. Default is null.
	 * @param arrivalAtSearchTime If true, specify that the search is for arrival time at the passed date and time
	 * and not for travel time. Default is null.
	 * @param products Optionally pass a list of products to allow travel via. Default is null (no such preferences).
	 * @param includePassedStations If true, the response will include a list of all stations that are passed along the way.
	 * Default is null (no such preferences).
	 * @param minChangeTime Pass the minimum time for changes if you want to. Default is null (no customization, SL default value).
	 * @param maxChangeTime Pass the maximum time for changes if you want to. Default is null (no customization, SL default value).
	 * @param avoidArgs If you have any point added as an "avoid" point, you can optionally pass a list
	 * of arguments to pass to the point's generateAvoidString method. Refer to that method to see
	 * how to structure your list and the available options.
	 * @param viaArgs If you have any point added as a "via" point, you can optionally pass a list
	 * of arguments to pass to the point's generateViaString method. Refer to that method to see
	 * how to structure your list and the available options.
	 * @param context: Parameter from the SL API to search for newer or earlier departures than the current search.
	 * You can pass the return value scrB or scrF from a previous API request.
	 * @return {Promise<*>}  Await me and you will (hopefully) get a JSON response from the API.
	 */
	async reseplanerare(
		includedPoints,
		searchDate = null,
		searchTime = null,
		tripsBeforeStartTime = 0,
		tripsAfterStartTime = null,
		arrivalAtSearchTime = null,
		products = null,
		includePassedStations = null,
		minChangeTime = null,
		maxChangeTime = null,
		avoidArgs = [],
		viaArgs = [],
		context = null
	) {
		let urlParameters = {
			numB: tripsBeforeStartTime,
			searchForArrival: this._bool_to_int(arrivalAtSearchTime)
		};
		// Handle user-passed URL parameters
		urlParameters = this.addURLParametersIfDefined(
			urlParameters,
			{
				Date: searchDate,
				Time: searchTime,
				numF: tripsAfterStartTime,
				searchForArrival: arrivalAtSearchTime,
				minChangeTime: minChangeTime,
				maxChangeTime: maxChangeTime,
				Passlist: includePassedStations
			},
			true
		);
		// Add products string if defined
		if (products !== null) {
			// The user passes products like "metro", "tram", etc. but we want their linked slNumber.
			let productNumber = 0;
			for (const product of products) {
				if (Object.keys(API_TRAVEL_METHOD_TYPES).includes(product)) {
					productNumber += API_TRAVEL_METHOD_TYPES[product].slNumber;
				} else {
					console.warn(
						`Invalid argument passed to trip planner: ${product} doesn't seem to be a valid product!`
					);
				}
			}
			// The SL API specifies a list of integers for different travel methods.
			// If the caller decided to pass a list of travel methods to include  (default is just add
			// all), we add the passed numbers together according to the API documentation. Aka we
			// generate the products to pass by passing a bitmask (as the SL API fancily calls it)
			// of the products that the user passed
			urlParameters.Products = productNumber;
		}
		// Do same for context
		if (context !== null) {
			urlParameters.Context = context;
		}
		// Now, construct our request based on the points and their types
		for (const includedPoint of includedPoints) {
			// If the object can just be added directly with its toObject method, do that
			if (
				includedPoint.pointType === POINT_TYPE_ORIGIN ||
				includedPoint.pointType === POINT_TYPE_DESTINATION
			) {
				// This is a nice function which is essentially supposed to be like extend() for lists but for objects.
				urlParameters = Object.assign(urlParameters, includedPoint.toObject());
			}
			// if not, add it to the via or the avoid string
			else if (includedPoint.pointType === POINT_TYPE_VIA) {
				// Add parameter if not defined
				if (urlParameters.Via === undefined) {
					urlParameters.Via = [];
				}
				// Call the method of the point to generate the string, pushing the arguments
				urlParameters.Via.push(includedPoint.generateViaString(...viaArgs));
			} else {
				// Add parameter if not defined
				if (urlParameters.Avoid === undefined) {
					urlParameters.Avoid = [];
				}
				// Call the method of the point to generate the string, pushing the arguments
				urlParameters.Avoid.push(includedPoint.generateAvoidString(...avoidArgs));
			}
		}
		if (urlParameters.Via !== undefined) {
			urlParameters.Via = urlParameters.Via.join(';');
		}
		if (urlParameters.Avoid !== undefined) {
			urlParameters.Avoid = urlParameters.Avoid.join(';');
		}
		console.log(`Requesting reseplanerare with arguments: ${JSON.stringify(urlParameters)}`);
		// Ready for sending the request!
		const responseJSON = await this.sendRequest(
			this.apiKeys.reseplanerare,
			'/TravelplannerV3_1/trips.json',
			urlParameters
		);
		// Check for errors (SL API doesn't like using status codes)
		if (responseJSON.errorCode !== undefined || responseJSON.errorText !== undefined) {
			// Create a text with error information
			let errorInformation =
				responseJSON.errorCode !== undefined
					? `Error code: ${responseJSON.errorCode}`
					: 'Error code not available.';
			errorInformation +=
				responseJSON.errorText !== undefined
					? ` Error text: ${responseJSON.errorText}`
					: ' Error text not available.';
			if (responseJSON.errorCode === 'SVC_NO_RESULT') {
				throw new NoTripsFoundError();
			} // If no trips were found
			else {
				throw new Error(`The SL reseplanerare API returned an error: ${errorInformation}`);
			}
		}
		return responseJSON; // Return the result if we don't have an error
	}
}
