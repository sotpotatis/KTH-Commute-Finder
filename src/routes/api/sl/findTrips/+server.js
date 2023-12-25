/* findTrips.js
API endpoint to find SL trips from a point A to a point B.
Includes some utilities, like overriding the walk time to a certain place. */
import { slWrapper, slAPI } from '../../../../lib/apiClients.js';
import {
	API_STATUS_ERROR,
	API_STATUS_OK,
	checkIsValidNumber,
	generateResponse,
	GENERIC_SERVER_ERROR,
	INVALID_NUMERIC_PARAMETERS,
	MISSING_REQUIRED_ARGUMENTS,
	validateURLParameters
} from '../../utilities.js';
import {
	Coordinate,
	POINT_TYPE_DESTINATION,
	POINT_TYPE_ORIGIN,
	Station
} from '../../../../lib/slAPI/reseplanerareClasses.js';
import { DateTime, Duration } from 'luxon';
import {
	API_TRAVEL_METHOD_TYPES,
	NoTripsFoundError,
	PRODUCT_TYPE_TO_API_TYPE
} from '../../../../lib/slAPI/sl.js';
const UNPARSEABLE_TRIP_RESPONSE = () => {
	return generateResponse(
		API_STATUS_ERROR,
		{
			message:
				'The service was not able to parse the trip that you requested. Please try again later.'
		},
		500
	);
};

const VALID_API_TRAVEL_METHODS = Object.keys(API_TRAVEL_METHOD_TYPES);

// Define some parsing functions
/**
 * This function converts what is under "Origin" or "Destination" in an SL trip to a more readable type of JSON
 * with the data that we want.
 * @param tripLocation The input data from the SL API.
 */
function tripLocationToJson(tripLocation) {
	const TRIP_LOCATION_TYPE_TO_API_TYPE = {
		// Convert SL trip location types to a format I like better
		ST: 'station',
		ADR: 'address'
	};
	// Get when SL told us we should be on the part
	const locationTime = DateTime.fromISO(`${tripLocation.date}T${tripLocation.time}`);
	let parsedData = {
		name: tripLocation.name,
		time: locationTime,
		location: {
			latitude: tripLocation.lat,
			longitude: tripLocation.lon
		}
	};
	if (TRIP_LOCATION_TYPE_TO_API_TYPE[tripLocation.type] === undefined) {
		console.warn(
			`Could not parse SL trip location type ${tripLocation.type}! Please look into the conversion.`
		);
		return null;
	} else {
		parsedData.locationType = TRIP_LOCATION_TYPE_TO_API_TYPE[tripLocation.type];
	}
	// Add other data
	if (tripLocation.extId !== undefined) {
		// If there is an SL ID for the current entry
		parsedData.slID = tripLocation.extId;
	}
	return parsedData;
}

/**
 * Converts a Product dictionary from the SL API to something readable that we can extract things from.
 * @param tripPartJSON The input JSON from a trip part from the SL API.
 */
function tripProductToJson(tripPartJSON) {
	const tripProduct = tripPartJSON.Product;
	let parsedProduct = {
		type: PRODUCT_TYPE_TO_API_TYPE[tripProduct.catIn],
		name: tripProduct.name
	};
	if (parsedProduct.type === undefined) {
		console.warn(`Failed to parse trip type: ${tripProduct.catIn}. Please add a parser for this!`);
		return null;
	}
	if (tripProduct.line !== undefined && !isNaN(tripProduct.line)) {
		parsedProduct.line = Number(tripProduct.line);
	}
	// Add destination station for journey that you're travelling
	parsedProduct.finalStation = tripPartJSON.direction;
	return parsedProduct;
}
/**
 * This function converts a part of a trip (a "leg" as SL calls it) to a more readable type of JSON with the data
 * that we want.
 * @param tripPart The input data from the SL API.
 */
function tripPartToJson(tripPart) {
	// Handle different types
	// Fill out what we already know. This seems to be available for all location data. Start somewhere!
	const tripOrigin = tripLocationToJson(tripPart.Origin);
	const tripDestination = tripLocationToJson(tripPart.Destination);
	// Note: the above data may be null if conversion failed. Check.
	if (tripOrigin === null || tripDestination === null) {
		console.warn(`Failed to parse trip origin or destionation! Returning null.`);
		return null;
	}
	let parsedTrip = {
		origin: tripOrigin,
		destination: tripDestination
	};
	// Add stops if included
	if (tripPart.Stops !== undefined && tripPart.Stops !== null) {
		parsedTrip.stops = [];

		for (const stop of tripPart.Stops.Stop) {
			let parsedStop = { name: stop.name };
			// The first stop in a series does not have arrDate.
			const relevantTime = stop.arrDate !== undefined ? 'arr' : 'dep';
			const stopDateString = `${stop[`${relevantTime}Date`]}T${stop[`${relevantTime}Time`]}`;
			parsedStop.time = DateTime.fromISO(stopDateString);
			parsedTrip.stops.push(parsedStop);
		}
	}
	if (tripPart.type === 'JNY') {
		// Journey - travel from one station to another
		parsedTrip.type = 'publicTransport';
		parsedTrip.messages = [];
		if (tripPart.Product !== undefined) {
			let tripProduct = tripProductToJson(tripPart);
			if (tripProduct === null) {
				// If trip product parsing failed.
				console.warn(`Failed to parse trip product! Returning null.`);
				return null;
			}
			parsedTrip.product = tripProduct;
		} else {
			parsedTrip.product = null;
		}
		// Add messages if found for this trip part.
		// These messages includes information about any trip deviations,
		// service disruptions, etc.
		if (tripPart.Messages !== undefined) {
			for (const message of tripPart.Messages.Message) {
				if (!parsedTrip.messages.includes(message)) {
					parsedTrip.messages.messages.push({
						title: message.head,
						body: message.text,
						priority: message.priority !== undefined ? message.priority : 0 // I can image this is not always included
					});
				}
			}
		}
	} else if (tripPart.type === 'WALK') {
		// Walk - well, walk from one place to another
		parsedTrip.type = 'walk';
		parsedTrip.distance = tripPart.dist;
		parsedTrip.walkTime = Duration.fromISO(tripPart.duration);
	} else {
		console.warn(
			`Did not understand trip type ${tripPart.type}! Please add a function to handle it.`
		);
		return null;
	}
	return parsedTrip;
}

/**
 * Parse a full trip as returned from the SL API.
 * @param rawTripData The trip data as returned from the SL API.
 * @param overriddenWalkingTime Any overriden walking time of the last walk entry in the API
 * return.
 * @return {*} The parsed trip as a object.
 */
function parseTrip(rawTripData, overriddenWalkingTime = null) {
	const tripData = {
		totalDuration: Duration.fromISO(rawTripData.duration).toISO(),
		parts: [],
		messages: [] // SL-added service messages
	};
	const tripParts = rawTripData.LegList.Leg;
	// Add data for each part
	for (let i = 0; i < tripParts.length; i++) {
		const tripPart = tripParts[i];
		let parsedTripPart = tripPartToJson(tripPart);
		// parsedTripPart will be null if the conversion failed
		if (parsedTripPart === null) {
			console.warn(`Something was not parseable along the process! Returning error...`);
			return null;
		}
		if (i === tripParts.length - 1 && parsedTripPart.type !== 'walk') {
			console.warn(
				`Unparseable trip suggestion: The last trip element is not a walk! Please check it: ${JSON.stringify(
					parsedTripPart
				)}`
			);
			return null;
		}
		// Join together walks. The SL API likes to split walks for some reason.
		// Here, we ensure that we get multiple "walks" together
		if (
			parsedTripPart.type === 'walk' &&
			tripData.parts[i - 1] !== undefined &&
			tripData.parts[i - 1].type === 'walk'
		) {
			tripData.parts[i - 1].destination = parsedTripPart.destination;
			tripData.parts[i - 1].distance += parsedTripPart.distance;
			tripData.parts[i - 1].walkTime = Duration.fromISO(parsedTripPart.walkTime)
				.plus(Duration.fromISO(tripData.parts[i - 1].walkTime))
				.toISO();
		} else {
			tripData.parts.push(parsedTripPart);
		}
	}
	// Override walking time if set
	const lastTripPartIndex = tripData.parts.length - 1;
	if (overriddenWalkingTime !== null) {
		console.log('Overriding walking time of last trip entry.');
		// Update the walk time as well as the time for the final destination
		tripData.parts[lastTripPartIndex].walkTime = Duration.fromObject({
			minutes: overriddenWalkingTime
		}).toISO();
		tripData.parts[lastTripPartIndex].destination.time = tripData.parts[
			lastTripPartIndex - 1
		].destination.time.plus({ minutes: overriddenWalkingTime });
	}
	const lastTripPart = tripData.parts[lastTripPartIndex];
	tripData.arriveAt = {
		station: lastTripPart.origin.time,
		destination: lastTripPart.destination.time
	}; // Add when the user is expected to arrive at the station and at the destionation
	return tripData;
}
/**
 * Parse a list of trips as returned from the SL API.
 * @param rawTripsData The trips data as returned from the SL API.
 * @param overriddenWalkingTime Any overriden walking time of the last walk entry in the API
 * return.
 * @return {*} The parsed trips as an array of objects.
 */
function parseTrips(rawTripsData, overriddenWalkingTime) {
	// Now, we need to break down these trip suggestions in a nice way. I like nested dicts but SL returns a LOT of nested data.
	// Start with handling all the trips
	const parsedTrips = [];
	for (const rawTripData of rawTripsData) {
		const tripData = parseTrip(rawTripData);
		// We get null back if the trip was not parseable.
		if (tripData === null) {
			console.error(`The trip ${JSON.stringify(tripData)} was not parseable!`);
			return null;
		}
		parsedTrips.push(tripData);
	}
	return parsedTrips;
}

// Define main API route
export async function GET({ request }) {
	console.log('Got a request to /api/sl/findTrips');
	// Validate that parameters exist
	const [urlParametersValid, urlParameters] = validateURLParameters(
		['startStationId', 'arriveTime'],
		request
	);
	if (urlParametersValid) {
		try {
			// We still have to check that a destination has been enterred. There are two options:
			// Either "destinationLatitude" and "destinationLongitude" or "destinationStationId".
			let destination = null;
			if (
				urlParameters.get('destinationLatitude') !== null &&
				urlParameters.get('destinationLongitude') !== null
			) {
				destination = new Coordinate(
					POINT_TYPE_DESTINATION,
					urlParameters.get('destinationLatitude'),
					urlParameters.get('destinationLongitude')
				);
			} else if (urlParameters.get('destinationStationId') !== null) {
				destination = new Station(
					POINT_TYPE_DESTINATION,
					urlParameters.get('destinationStationId')
				);
			} else {
				console.log('Missing parameters for destination. Returning error...');
				return MISSING_REQUIRED_ARGUMENTS();
			}
			// The user can override the walking distance to the location and several other parameters.
			// Allow user to override and only allow certain travel methods in the result
			let travelMethods = null;
			if (urlParameters.has('includedTravelMethods')) {
				// Convert parameter to a list of numbers
				travelMethods = urlParameters.get('includedTravelMethods').split(',');
				// Ensure travel methods are valid
				for (const travelMethod of travelMethods) {
					if (!VALID_API_TRAVEL_METHODS.includes(travelMethod)) {
						console.log('Invalid overridden walking time. Returning error...');
						return generateResponse(API_STATUS_ERROR, {
							message: `${travelMethod} is not a valid travel method. Accepted travel methiods are: ${VALID_API_TRAVEL_METHODS.join(
								','
							)}.`
						});
					}
				}
			}
			let overriddenWalkingTime = null;
			if (urlParameters.has('overriddenWalkingTime')) {
				overriddenWalkingTime = checkIsValidNumber(urlParameters.get('overriddenWalkingTime'), 0);
				if (overriddenWalkingTime === null) {
					console.log('Invalid overridden walking time. Returning error...');
					return INVALID_NUMERIC_PARAMETERS();
				}
			}
			// Get and validate how many trips to search for
			// You can set +/- from the start time what times to include in the search result
			// For example, hoursBeforeArrivalTime=1 and hoursAfterArrivalTime=1 will include trips
			// within 1 hour before and 1 hour after the wished event.
			let hoursBeforeArrivalTime = 1;
			let hoursAfterArrivalTime = 1;
			if (urlParameters.has('hoursBeforeArrivalTime')) {
				hoursBeforeArrivalTime = checkIsValidNumber(urlParameters.get('hoursBeforeArrivalTime'), 0);
				if (hoursBeforeArrivalTime === null) {
					console.log('Invalid hours before arrival time count. Returning error...');
					return INVALID_NUMERIC_PARAMETERS();
				}
			}
			if (urlParameters.has('hoursAfterArrivalTime')) {
				hoursAfterArrivalTime = checkIsValidNumber(urlParameters.get('hoursAfterArrivalTime'), 0);
				if (hoursAfterArrivalTime === null) {
					console.log('Invalid trips after arrival count. Returning error...');
					return INVALID_NUMERIC_PARAMETERS();
				}
			}
			// Allow user to customize change time
			let minChangeTime = null;
			let maxChangeTime = null;
			if (urlParameters.has('minChangeTime')) {
				minChangeTime = checkIsValidNumber(urlParameters.get('minChangeTime'), 0);
				if (minChangeTime === null) {
					console.log('Invalid min change time. Returning error...');
					return INVALID_NUMERIC_PARAMETERS();
				}
			}
			if (urlParameters.has('maxChangeTime')) {
				maxChangeTime = checkIsValidNumber(urlParameters.get('maxChangeTime'), 0, maxChangeTime);
				if (maxChangeTime === null) {
					console.log('Invalid max change time count. Returning error...');
					return INVALID_NUMERIC_PARAMETERS();
				}
			}
			// Handle start search time (arrival time)
			const arriveTime = DateTime.fromISO(urlParameters.get('arriveTime')).setZone(
				'Europe/Stockholm'
			);
			// Find out search boundaries
			const latestArriveTime = arriveTime
				.plus({ hours: hoursAfterArrivalTime })
				.setZone('Europe/Stockholm');
			const earliestArriveTime = arriveTime
				.minus({ hours: hoursBeforeArrivalTime })
				.setZone('Europe/Stockholm');
			let searchArriveTime = earliestArriveTime;
			const allParsedTrips = [];
			let i = 1;
			while (searchArriveTime < latestArriveTime) {
				if (i > 15) {
					// avoid spamming the SL API due to recursion
					console.error('Too many SL requests!');
					// We still return something if we are past the arrive time
					if (searchArriveTime >= arriveTime) {
						console.log('Still past arrive time. Returning data...');
						break;
					} else {
						console.log('Not past arrive time, returning error.');
						return GENERIC_SERVER_ERROR();
					}
				}
				console.log(`Requesting reseplanerare with time: ${searchArriveTime}`);
				let parsedTrips = [];
				try {
					const tripSuggestionsData = await slAPI.reseplanerare(
						[new Station(POINT_TYPE_ORIGIN, urlParameters.get('startStationId')), destination],
						searchArriveTime.toISODate(),
						searchArriveTime.toLocaleString(DateTime.TIME_24_SIMPLE),
						6,
						0,
						true,
						travelMethods,
						true,
						minChangeTime,
						maxChangeTime
					);
					parsedTrips = parseTrips(tripSuggestionsData.Trip, overriddenWalkingTime);
				} catch (NoTripsFoundError) {
					console.log('No trips found for search!');
					return generateResponse(API_STATUS_OK, {
						trips: [],
						message:
							"SL's API could not find a trip for your request. Please try to refine your search parameters."
					});
				}
				if (parsedTrips === null) {
					return UNPARSEABLE_TRIP_RESPONSE();
				}
				searchArriveTime = parsedTrips[parsedTrips.length - 1].arriveAt.station; // Increase search time
				console.log(`Last arrival time of returned trips: ${searchArriveTime.toISOTime()}`);
				allParsedTrips.push(...parsedTrips);
				console.log('Done with one parsing round, maybe doing another...');
				i += 1;
			}
			// Remove any possible duplicates
			allParsedTrips.filter((element, elementIndex) => {
				return allParsedTrips.indexOf(element) === elementIndex;
			});
			return generateResponse(API_STATUS_OK, { trips: allParsedTrips });
		} catch (e) {
			console.error(`Something went wrong when finding trips: ${e}. Returning error...`, e);
			return GENERIC_SERVER_ERROR();
		}
	} else {
		console.log('Missing required arguments. Returning error...');
		return MISSING_REQUIRED_ARGUMENTS();
	}
}
