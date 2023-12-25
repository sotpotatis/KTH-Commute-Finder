/* utilities.js
Contains various utilities to generate API responses. */
// Statuses
export const API_STATUS_OK = 'ok';
export const API_STATUS_ERROR = 'error';
/**
 * Generates an API response with a certain status and certain data.
 * @param status Any status string from the constants API_STATUS_[..]
 * @param responseData Data to return in the response, as an Object.
 * @param statusCode A status to set. If undefined, will default to 200.
 * @return {*}
 */
export function generateResponse(status, responseData, statusCode = null) {
	if (statusCode == null) {
		// Fill out default status code
		statusCode = 200;
	}
	responseData.status = status;
	responseData.statusCode = statusCode;
	return new Response(JSON.stringify(responseData), {
		status: statusCode,
		headers: {
			'Content-Type': 'application/json'
		}
	});
}

/**
 * Helper function to validate that required URL parameters exist.
 * @param requiredURLParameters The required URL parameters that you want in a request.
 * @param request The request as passed to the Svelte server GET, POST, etc. function.
 * @return {boolean, URLSearchParams} Whether the URL parameters exist or not and a list of the search parameters.
 */
export function validateURLParameters(requiredURLParameters, request) {
	let foundURLParameters = [];
	const url = new URL(request.url); // Parse URL
	const urlParameters = new URLSearchParams(url.search);
	for (const wantedURLParameter of requiredURLParameters) {
		if (urlParameters.has(wantedURLParameter)) {
			foundURLParameters.push(wantedURLParameter);
		}
	}
	return [foundURLParameters.length === requiredURLParameters.length, urlParameters];
}
/**
 * Utility function for providing defaults to optional URL parameters.
 * @param optionalURLParameters The URL parameters that are optional as well as their default value.
 * For example: {parameter1: "default_value_1"}
 * @param providedURLParameters The URL parameters as URLSearchParams to analyze.
 * @returns A dictionary with the URL parameters and their default value or the user-provided value
 */
export function getOptionalURLParameters(optionalURLParameters, providedURLParameters) {
	let urlParameters = {};
	for (const [parameterName, defaultValue] of Object.entries(optionalURLParameters)) {
		urlParameters[parameterName] = providedURLParameters.has(parameterName) // If parameter exists
			? providedURLParameters.get(parameterName)
			: defaultValue;
	}
	return urlParameters;
}

/**
 * Checks whether a given input is a valid number or not.
 * @param userInput The provided input.
 * @param lowestAllowedValue The lowest allowed value, if any.
 * @param highestAllowedValue The highest allowed value, if any.
 */
export function checkIsValidNumber(userInput, lowestAllowedValue, highestAllowedValue) {
	// Fill out defaults
	if (lowestAllowedValue === undefined) {
		lowestAllowedValue = null;
	}
	if (highestAllowedValue === undefined) {
		highestAllowedValue = null;
	}
	if (userInput.isNaN) {
		return null;
	} else {
		userInput = Number(userInput);
		if (lowestAllowedValue !== null && userInput < lowestAllowedValue) {
			return null;
		}
		if (highestAllowedValue !== null && userInput > highestAllowedValue) {
			return null;
		}
		return userInput; // If all validations passed
	}
}
// Pre-created responses
// Note: these are defined as functions as you can not re-use a Response in multiple
// requests.
export const MISSING_REQUIRED_ARGUMENTS = () => {
	return generateResponse(
		API_STATUS_ERROR,
		{
			message: 'Bad request - missing required arguments.'
		},
		400
	);
};
export const INVALID_NUMERIC_PARAMETERS = () => {
	return generateResponse(
		API_STATUS_ERROR,
		{
			message: 'Bad request - invalid numeric parameters.'
		},
		400
	);
};
export const SCHEDULE_RETRIEVAL_ERROR_RESPONSE = () => {
	return generateResponse(
		API_STATUS_ERROR,
		{
			success: false,
			message: 'Schedule request and/or parse failed.'
		},
		500
	);
};
export const GENERIC_SERVER_ERROR = () => {
	return generateResponse(
		API_STATUS_ERROR,
		{
			success: false,
			message: 'Something went wrong (server error)'
		},
		500
	);
};
