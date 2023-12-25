/* utils.js
Various utilities used by the code. */
import { DateTime } from 'luxon';

/**
 * Gets the current time in Swedish timezone represented as a Luxon DateTime.
 * @return {DateTime} The current time in Swedish timezone represented as a Luxon DateTime.
 */
export function getNow() {
	return DateTime.now().setZone('Europe/Stockholm');
}
/**
 * Allows you to pass a list of classes to an element's "class" tag.
 * Automatically joins the classes together to a string separated by spaces.
 * Very simple, but much cleaner.
 * @param classList A list of all the classes to include.
 * @return {string} A string with all the classes joined together.
 */
export function passClassList(classList) {
	return classList.join(' ');
}

/**
 * Removes an item from a list, wherever in the list that it is.
 * For example, pass "bar" to remove "bar" from ["foo", "bar"].
 * Note: does not work well with duplicate values!
 * @param item The item to remove.
 * @param list The list to remomve the item from.
 */
export function removeItemFromList(item, list) {
	console.log(list);
	const itemIndex = list.indexOf(item);
	if (itemIndex !== -1) {
		list.splice(itemIndex, 1);
	}
}

/**
 * Returns the last element of a list.
 * @param list The input list
 */
export function lastListElement(list) {
	return list[list.length - 1];
}

/**
 * Gets all travel methods that are included in a trip.
 * @param tripData The data of the trip.
 */
export function getTripTravelMethods(tripData) {
	let foundTravelMethods = [];
	for (const tripPart of tripData.parts) {
		if (tripPart.product !== undefined) {
			const tripPartProduct = tripPart.product.type.type;
			if (!foundTravelMethods.includes(tripPartProduct)) {
				foundTravelMethods.push(tripPartProduct);
			}
		}
	}
	return foundTravelMethods;
}
