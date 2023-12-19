/* api.js
* Implements an API wrapper for the website. */
export default class APIWrapper {
    /**
     * Sends a request to an API route.
     * @param apiRoute The API route to retrieve, relative to /api. For example: /api/schedule/validate --> /schedule/validate
     * @param urlParameters Any URL parameters to pass as an object, otherwise pass null.
     * @return {Promise<[boolean,{message: (*|string)}]|(boolean|any)[]|boolean[]>} A list in the format [request succeeded, request data].
     * Keep in mind that if the request failed, the data may be null.
     */
    async sendRequest(apiRoute, urlParameters=null){
        // Convert URL parameters from dict if applicable
        if (urlParameters !== null){
            urlParameters = "?" + new URLSearchParams(urlParameters).toString()
        }
        else {
            urlParameters = ""
        }
        const requestURL = `/api${apiRoute}${urlParameters}`
        console.log(`Sending request to ${requestURL}...`)
        try {
            // Send request
            const response = await fetch(requestURL)
            const responseJSON = await response.json()
            if (responseJSON.status !== "error"){
                console.log(`Request successful with response:`, responseJSON, `Returning...`)
                return [true, responseJSON]
            }
            else {
                console.log(`Request failed!`)
                // Return the error message
                return [false, {"message": responseJSON.message !== undefined?
                responseJSON.message : "Something went wrong in the request (the server didn't return a message)"}]
            }
        }
        catch (e) {
            console.error(`API request failed: ${e}. Returning null...`)
            return[false, null]
        }
    }

    /**
     * Sends a request to the API to validate a schedule URL.
     * @param scheduleURL The schedule URL to be validated.
     * @return {Promise<[boolean,{message: (*|string)}]|(boolean|*)[]|boolean[]>} A list in the format [request succeeded, request data].
     * Keep in mind that if the request failed, the data may be null.
     */
    async validateScheduleURL(scheduleURL){
        return await this.sendRequest("/schedule/validate", {
            scheduleURL: scheduleURL
        })
    }

    /**
     * Get and parse schedule events from a KTH Schedule URL.
     * @param scheduleURL The schedule URL to get the events from.
     * @param startDate The start date to get events for, as a string.
     * @param endDate The end date to get events for, as a string.
     * @return {Promise<[boolean,{message: (*|string)}]|(boolean|*)[]|boolean[]>} A list in the format [request succeeded, request data].
     * Keep in mind that if the request failed, the data may be null.
     */
    async getScheduleEvents(scheduleURL, startDate=null, endDate=null){
        let urlParameters = {scheduleURL: scheduleURL}
        // Add start and end date if set
        if (startDate !== null){
            urlParameters.startDate = startDate
        }
        if (endDate !== null){
            urlParameters.endDate = endDate
        }
        return await this.sendRequest("/schedule/getEvents", urlParameters)
    }

    /**
     * Sends a request to the API to find a station.
     * @param searchQuery The search query.
     * @return {Promise<[boolean,{message: (*|string)}]|(boolean|*)[]|boolean[]>} A list in the format [request succeeded, request data].
     * Keep in mind that if the request failed, the data may be null.
     */
    async findStation(searchQuery){
        return await this.sendRequest("/sl/findStation", {
            query: searchQuery
        })
    }

    /**
     * Finds trips from a certain station to a destination.
     * @param searchQuery The search query, containing data related to the trip search
     * For example:
     * {
     *      startStationId: "<SL station ID>",
     *      destinationLatitude = "<Coordinate>",
     *      destinationLongitude = "<Coordinate>",
     *     arriveTime: "2023-11-09T10:00"
     * }
     * @param overriddenWalkingTime Override the final walking time. Optional argument.
     * @param includedTravelMethods Any travel methods to include in the request. Add their SL ID.
     * Trips that include other travel methods will not  be included.
     * Optional list.
     * @return {Promise<[boolean,{message: (*|string)}]|(boolean|*)[]|boolean[]>}
     */
    async findTrips(searchQuery, overriddenWalkingTime, includedTravelMethods){
        // Add optional arguments
        if (overriddenWalkingTime !== undefined && overriddenWalkingTime !== null ){
            searchQuery.overriddenWalkingTime = overriddenWalkingTime
        }
        if (includedTravelMethods !== undefined && includedTravelMethods !== null ){
            searchQuery.includedTravelMethods = includedTravelMethods
        }
        // Since the search query will match up with the URL parameters, we send it directly as URL parameters
        return await this.sendRequest("/sl/findTrips", searchQuery)
    }
}