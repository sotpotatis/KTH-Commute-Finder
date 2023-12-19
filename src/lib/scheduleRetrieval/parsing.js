/* parsing.js
* Various parsing utilities related to parsing and extracting data from schedules
* - for example parsing building names, prettifying output etc. */
import {DateTime} from "luxon";
import {getRoomData} from "../caching/caching.js";
import {findBuildingsFromRooms} from "../kthPlacesAPI/api.js";

const EVENT_TITLE_TRIMMING_REGEX = /\([a-ö0-9]+\)|(se beskrivning)|(see description)|\.|\n/ig // (i = case insensitive)
// To have cool output on webpages, we define some generic event types.
// These event types have a cool prefix (for use with badges), defined icons etc.
// We also have defined whether these events have AQ (Academic Quarter/Akademisk kvart) or not.
const EVENT_TYPES = [{
    id: "lab",
    text: {
        swedish: "Laboration",
        english: "Lab",
    },
    regex: `.*(lab).*`,
    hasAQ: false
},
{
    id: "practise",
    text: {
        swedish: "Övning",
        english: "Practise",
    },
    hasAQ: true,
    regex: `.*(övn|pract).*`
},
{
    id: "lecture",
    text: {
        swedish: "Föreläsning",
        english: "Lecture"
    },
    hasAQ: true,
    regex: `.*(föreläsn|lecture).*`
},
{
    id: "seminar",
    text: {
        swedish: "Seminarium",
        english: "Seminar"
    },
    hasAQ: true,
    regex: `.*(seminar).*`
},
{
    id: "helpSession",
    text: {
        swedish: "Räknestuga",
        english: "Help session"
    },
    hasAQ: true,
    regex: `.*(help|räknestuga).*`
},
// Redovisning
{
    id: "presentation",
    text: {
        swedish: "Redovisning",
        english: "Presentation"
    },
    hasAQ: false,
    regex: `.*(redovisning|presentation).*`
},
// Kontrollskrivning - English translation taken from
// https://folkets-lexikon.csc.kth.se/kthordbok/#lookup&kontrollskrivning&1
{
    id: "partialExam",
    text: {
        swedish: "Kontrollskrivning",
        english: "Partial exam/Quiz"
    },
    hasAQ: false,
    regex: `.*(kontrollskrivning|quiz|partial).*`
},
// Tentamen - English translation taken from
// https://folkets-lexikon.csc.kth.se/kthordbok/#lookup&tentamen&1
{
    id: "examination",
    text: {
        swedish: "Tenta",
        english: "Exam"
    },
    hasAQ: false,
    regex: `.*(tenta|exam).*`
}
]
export function parseSummary(summaryText){
    let parsedSummaryData = {}
    // Begin to parse the title, which is from the summary
    const summarySplit = summaryText.split("-")
    // We first extract an event type, for example:
    // Övning - Envariabelanalys --> the course is Envariabelanalys
    // and the even type is a practise
    if (summarySplit.length > 1){
        const eventPrefix = summarySplit[0].trim()
        for (const eventType of EVENT_TYPES){
            const eventTypeRegex = new RegExp(eventType.regex, "ig")
            // If we found a match - set the type!
            if (eventPrefix.match(eventTypeRegex)){
                parsedSummaryData.type = eventType
            }
        }
        // If the code did not find a type
        if (parsedSummaryData.type === undefined){
            console.warn(`Failed to parse ${summaryText} (${eventPrefix}) to an event type (no event type found).`)
            parsedSummaryData.type = null
        }
        // Trim away some other extra stuff (the course code for example)
        // before storing the parsed event title.
        let eventTitle = summarySplit.slice(1).join("-")
        eventTitle = eventTitle.replaceAll(EVENT_TITLE_TRIMMING_REGEX, "")
        parsedSummaryData.title = eventTitle.trim()
    }
    else {
        console.warn(`Failed to parse ${summaryText} to an event type (missing delimiter).`)
    }
    return parsedSummaryData
}
const STREET_REGEX = /(gat(an*|o[a-ö]+)|väg|back[a-ö]+|ringen)/ig

/**
 * Parses the location data of a certain event. Removes street addresses
 * and also extracts buildings.
 * @param location The location string of the event.
 * @return {*}
 */
export async function parseLocations(location){
    // Parse locations
    const locations = location.split(",")
    let parsedLocations = {
        rooms: [], // This contains rooms that the event is related to
        buildings: null
    }
    for (const location of locations){
        // We do not want to include street addresses in the locations
        // (it is sometimes added to the schedule where the room is given
        // anyways, so it is extra information basically)
        let trimmedLocation = location.trim()
        if (!trimmedLocation.match(STREET_REGEX)){
            // Look up the building and other information for the room
            const roomData = await getRoomData(trimmedLocation)
            let locationInformation = {dataAvailable: false, information: null}
            // The function above returns null if data is not found
            if (roomData !== null){
                console.log(`Found information for room ${trimmedLocation}`)
                locationInformation.dataAvailable = true
                locationInformation.information = { // Add information. We expect this from the API
                    roomName: location,
                    roomId: roomData.roomId,
                    roomType: roomData.roomType,
                    location: {
                        latitude: roomData.geoData.lat,
                        longitude: roomData.geoData.long,
                        floor: Number(roomData.floor),
                        buildingName: roomData.buildingName,
                        campus: roomData.campus,
                        address: `${roomData.streetAddress} ${roomData.streetNumber}`
                    }
                }
            }
            else {
                console.warn(`Did not find room data for ${trimmedLocation}.`)
            }
            parsedLocations.rooms.push(locationInformation)
        }
    }
    // ...update the building informations
    parsedLocations.buildings = findBuildingsFromRooms(parsedLocations.rooms)
    return parsedLocations
}

/**
* The dates used by the node-ical parser uses Moment.JS.
*  However, I want to use the new Luxon of course
* Converts a time in the format that the ical library uses
* to a time as an ical.
* @param calendarTime The time from the calendar.
 */
export function calendarTimeToLuxon(calendarTime){
    return DateTime.fromISO(calendarTime.toISOString()).setZone("Europe/Stockholm")
}
/**
 * Parses a calendar event (from a CalendarResponse from the ical library)
 * to a JSON- and user-friendly object with the data that we want.
 * @param calendarEvent The calendar event as output from node-ical.
 */
export async function parseEvent(calendarEvent){
    let parsedEventData = {}
    // Parse the summary...
    parsedEventData.summary = parseSummary(calendarEvent.summary)
    // ...then the location...
    if (calendarEvent.location !== undefined){
    parsedEventData.location = await parseLocations(calendarEvent.location)
    }
    else {
        console.warn("Missing location data for calendar event", calendarEvent)
    parsedEventData.location = null
        }
    // ...add start and end times...
    parsedEventData.start = calendarTimeToLuxon(calendarEvent.start)
    parsedEventData.end = calendarTimeToLuxon(calendarEvent.end)
    parsedEventData.date = parsedEventData.start.toISODate()
    // ...and then we have everything that we need!
    return parsedEventData
}