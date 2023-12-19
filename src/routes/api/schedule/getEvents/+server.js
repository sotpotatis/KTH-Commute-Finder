/* /api/schedule/getEvents.js
Gets the events from a schedule link and returns parsed events. */
import {
    API_STATUS_ERROR, API_STATUS_OK,
    generateResponse,
    getOptionalURLParameters,
    MISSING_REQUIRED_ARGUMENTS, SCHEDULE_RETRIEVAL_ERROR_RESPONSE,
    validateURLParameters
} from "../../utilities.js";
import {DateTime} from "luxon";
import {extractEvents, retrieveSchedule} from "../../../../lib/scheduleRetrieval/retrieveSchedule.js";
import {parseEvent} from "../../../../lib/scheduleRetrieval/parsing.js";
import {getNow} from "../../../../lib/utils.js";
import {getCachedSchedule} from "../../../../lib/caching/caching.js";

export async function GET({request}){
    console.log("Got a request to get events for a calendar.")
    const [urlParametersValid, urlParameters] = validateURLParameters(["scheduleURL"], request)
    if (urlParametersValid) {
        // Get start and end date, if provided
        const now = getNow()
        const optionalURLParameterSettings = {
            startDate: now.startOf("day"),
            endDate: now.endOf("day")
        }
        const optionalURLParameters = getOptionalURLParameters(optionalURLParameterSettings, urlParameters)
        // Validate that these extra URL parameters are valid if they are user-passed
        for (const [optionalParameter, defaultParameterValue] of Object.entries(optionalURLParameterSettings)){
            if (optionalURLParameters[optionalParameter] !== defaultParameterValue){
                console.log(`Validating user-passed ${optionalParameter}...`)
                const optionalURLParameterDateTime = DateTime.fromISO(optionalURLParameters[optionalParameter])
                optionalURLParameters[optionalParameter] = optionalURLParameterDateTime
                if (!optionalURLParameters[optionalParameter].isValid){
                    console.log("Invalid user date value. Returning error...")
                    return generateResponse(API_STATUS_ERROR, {message: `Invalid value of the parameter \"${optionalParameter}\" supplied. Please check it.`},
                        400)
                }
                else {
                    // For user parameters that are dates, do the same as above: for startDate, take the start of the day, and for end date,
                    // take the end of the day.
                    optionalURLParameters[optionalParameter] = optionalParameter === "startDate" ? optionalURLParameterDateTime.startOf("day") : optionalURLParameterDateTime.endOf("day")
                }
            }
        }
        console.log("Any optional user-passed arguments are valid. Requesting schedule...")
        try {
            // Retrieve schedule
            const schedule = await getCachedSchedule(urlParameters.get("scheduleURL"))
            if (schedule !== null){
                console.log("Extracting events...")
                const scheduleEvents = await extractEvents(schedule, optionalURLParameters.startDate, optionalURLParameters.endDate)
                console.log("Events extracted.")
                // The optional URL parameter &raw=false can be set if the user wishes to get raw data
                if (urlParameters.get("raw") === false){
                    console.log("Returning raw events (requested by the user)...")
                    return generateResponse(API_STATUS_OK, {
                        events: scheduleEvents,
                        message: `Note: Showing raw data. 
                        Remove the \"raw\" URL paramter included in your request or change it to get parsed, pretty, data.`
                    })
                }
                else {
                    console.log("Parsing events...")
                    const scheduleEventsParsed = {} // Group schedule events by day
                    for (const scheduleEvent of scheduleEvents){
                        const scheduleEventParsed = await parseEvent(scheduleEvent)
                        // Add list for day if not added yet
                        if (scheduleEventsParsed[scheduleEventParsed.date] === undefined){
                            scheduleEventsParsed[scheduleEventParsed.date] = []
                        }
                        scheduleEventsParsed[scheduleEventParsed.date].push(scheduleEventParsed)
                    }
                    console.log("Schedule events parsed. Returning them...")
                    return generateResponse(API_STATUS_OK, {
                        events: scheduleEventsParsed
                    })
                }
            }
            else {
                console.log("Schedule retrieval failed. Returning error...")
                return SCHEDULE_RETRIEVAL_ERROR_RESPONSE()
            }
        }
        catch (e) {
            console.log(`Schedule retrieval failed: ${e}. Returning error...`, e)
            return SCHEDULE_RETRIEVAL_ERROR_RESPONSE()
        }
    }
    else {
        console.log("URL parameters missing! Returning error...")
        return MISSING_REQUIRED_ARGUMENTS()
    }
}