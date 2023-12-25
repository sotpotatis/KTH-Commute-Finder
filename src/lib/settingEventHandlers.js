/* settingEventHandlers.js
Handlers that save the settings returned by settings-related components (such as
ScheduleLinkInputScreen).
Pass event to these functions and they will set the settings for you!
*/
import { API_TRAVEL_METHOD_TYPES } from './slAPI/sl.js';

export function handleScheduleLinkSetting(event, settings) {
	const scheduleLink = event.detail.scheduleLink;
	console.log('Received schedule link!', scheduleLink);
	// Save schedule link to user settings
	settings.setSetting('scheduleURL', scheduleLink);
	settings = settings;
	return scheduleLink;
}
export function handleSavedStationsSetting(event, settings) {
	const newStationsData = event.detail.stations;
	console.log('Received updated stations settings!', newStationsData);
	settings.setSetting('savedStations', newStationsData);
	settings = settings;
	return newStationsData;
}
export function handleAvoidedTravelMethodsSetting(event, settings) {
	const newAvoidedTravelMethods = event.detail.avoidedTravelMethods;
	console.log('Received new avoided travel methods preferences.');
	const changeForbidden =
		newAvoidedTravelMethods.length === Object.keys(API_TRAVEL_METHOD_TYPES).length;
	if (!changeForbidden) {
		// If the user hasn't disabled all the travel methods
		settings.setSetting('avoidedTravelMethods', newAvoidedTravelMethods);
		settings = settings;
		return newAvoidedTravelMethods;
	}
	return null;
}
