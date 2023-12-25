/* retrieveSchedule.js
Contains some code for retrieving schedules.
*/
import ical from "node-ical"
import {DateTime, Interval} from "luxon";
import {calendarTimeToLuxon} from "./parsing.js";

/**
 * Retrieves the raw content of a schedule from a URL.
 * @param scheduleURL The URL of the schedule to retrieve.
 * @return {Promise<void>}
 */
export async function retrieveRawSchedule(scheduleURL){
    let response = await fetch(scheduleURL)
    if (response.status === 200){
        let scheduleBlob = await response.blob()
        console.log(`Schedule retrieved.`)
        return scheduleBlob.text()
    }
    else {
        console.warn(`Request failed with status code ${response.status}`)
        return null
    }
}

/**
 * Parses the cache of a schedule to an iCal object that we can work with.
 * @param scheduleText The schedule text to work with
 */
export async function parseScheduleText(scheduleText){
    let calendarData = ical.parseICS(scheduleText)
    // The ical library gicves us an empty object if data is incorrect
    if (Object.keys(calendarData).length === 0){
        console.warn(`Failed to parse schedule: empty schedule object retrieved.`)
        return null
    }
    console.log(`Schedule parsed.`)
    return calendarData
}
/**
 * Retrieves the content from a schedule.
 * @param scheduleURL The schedule URL to retrieve.
 * @return {Promise<CalendarResponse>} null if the request failed, parsed data if it succeeded and
 * returned a parseable iCal file.
 */
export async function retrieveSchedule(scheduleURL){
    console.log(`Requesting schedule...`)
    const rawSchedule = await retrieveRawSchedule(scheduleURL)
    if (rawSchedule !== null){
        return parseScheduleText(rawSchedule)
    }
    else {
        console.warn("Could not access a schedule.")
        return null
    }
}

/**
 * Returns calendar events from a certain date based on a calendar response.
 * @param calendarData The calendar to extract the data from. A CalendarResponse from retrieveSchedule.
 * @param startDate The start date to return calendar events from
 * @param endDate The start date to return calendar events from
 * @return {Promise<void>}
 */
export async function extractEvents(calendarData, startDate, endDate){
    console.log(`Filtering events for the date window ${startDate.toISODate()}-${endDate.toISODate()}...`)
    const calendarEvents = []
    for (const calendarEventKey of Object.keys(calendarData)){
        // All interesting events have the type VEVENT
        const calendarEvent = calendarData[calendarEventKey]
        if (calendarEvent.type === "VEVENT"){
            if (calendarEvent.start !== undefined){
                const eventStart = calendarTimeToLuxon(calendarEvent.start)
                if (eventStart >= startDate && eventStart <= endDate){
                    calendarEvents.push(calendarEvent)
                }
            }
        }
    }
    console.log(`Event filtering completed, resulted in ${calendarEvents.length} calendar events.`)
    return calendarEvents
}