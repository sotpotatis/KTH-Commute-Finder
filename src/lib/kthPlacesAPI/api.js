/* api.js
A wrapper around the KTH Places API. */
export class KTHPlacesAPI {
    /**
     * Creates a new KTHPlacesAPI wrapper instance.
     * @param apiKey Your API key for accessing the API.
     * @param userAgent A user agent used for request identification.
     */
    constructor(apiKey, userAgent) {
        this.apiKey = apiKey
        this.userAgent = userAgent
        // Generate request headers to send
        this.requestHeaders = {
            "api_key": this.apiKey,
            "User-Agent": this.userAgent
        }
    }
    /**
     * Sends a request to a given API, makes sure we're authenticated and then returns the response JSON if any.
     * @param endpointPath The URL to request, relative to https://api.kth.se/api/places/v3
     * @return {Promise<any>}
     */
    async sendRequest(endpointPath){
        const requestURL = `https://api.kth.se/api/places/v3${endpointPath}`
        const response = await fetch(requestURL, {
            headers: this.requestHeaders
        })
        if (response.status !== 200){
            throw new Error(`A request to the KTH Places API failed with status code ${response.status}`)
        }
        return await response.json() // Return the response JSON
    }
    /**
     * Finds a room based on a name and returns data if it was found and null if it was not found.
     * @param roomName The name of the room to find.
     * @return {Promise<void>} Data if the room could be found, otherwise null if the room could not be found.
     */
    async findRoom(roomName){
        const responseData = await this.sendRequest(`/room/name/${roomName}`)
        // Check if room was found or not
        if (Object.keys(responseData).length === 0){
            console.warn(`Requested KTH room ${roomName} not found (response: ${JSON.stringify(responseData)}).`)
            return null
        }
        else { // If the room was found.
            return responseData
        }
    }

}
/**
 * Extracts all buildings from a list of rooms. This groups together
 * rooms that are in the same building.
 * @param roomsData The rooms to group together as return data from the API.
 */
export function findBuildingsFromRooms(roomsData){
    const roomBuildings = {}
    for (const [roomName, roomData] of Object.entries(roomsData)){
        // Check if building has not been grouped already
        if (roomData.dataAvailable  && roomData.information.location !== undefined  && roomData.information.location.buildingName !== undefined){
            const buildingName = roomData.information.location.buildingName
            if (roomBuildings[buildingName] === undefined){
                roomBuildings[buildingName] = []
            }
            roomBuildings[buildingName].push(roomName)
        }
    }
    return roomBuildings
}