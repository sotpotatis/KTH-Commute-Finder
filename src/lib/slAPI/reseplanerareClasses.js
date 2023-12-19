/* reseplanerareClasses.js
* Contains some classes that is by the Reseplanerare API function.
* (points, constants etc.)
* */

export const POINT_TYPE_VIA = "via" // If the user is travelling "via" the thing
export const POINT_TYPE_AVOID = "avoid" // If the station should be avoided in the planner
export const POINT_TYPE_ORIGIN = "origin"
export const POINT_TYPE_DESTINATION = "destination"
export class Coordinate {
    /**
     * Represents a trip beginning it, or ending at, a coordinate.
     * @param pointType POINT_TYPE_ORIGIN if you're travelling from this location, POINT_TYPE_DESTINATION if you're
     * travelling to it. POINT_TYPE_VIA is not supported for this type of object (it is only supported for stations)
     * @param latitude The latitude of the location.
     * @param longitude The longitude of the location.
     */
    constructor(pointType, latitude, longitude) {
        if (pointType === POINT_TYPE_VIA){
            throw new Error("POINT_TYPE_VIA is not supported for this type of object (it is only supported for stations).")
        }
        this.pointType = pointType
        this.type = this.pointType === POINT_TYPE_DESTINATION ? "dest": "origin"
        this.latitude = latitude
        this.longitude = longitude
    }
    toObject(){
        let objectRepresentation = {}
        // Add coordinates as "destCoordLat", "destCoordLong" (or the other way
        // around if it is an origin).
        objectRepresentation[`${this.type}CoordLat`] = this.latitude
        objectRepresentation[`${this.type}CoordLong`] = this.longitude
        return objectRepresentation
    }
}
// "Via" statuses. Provided from the API docs. See it if you want to read more
// (although I must admit, that the docs is a little vague on what these mean
// and how they are applied if using them.)
export const VIA_BOARDING_AND_DISEMBARKING_REQUIRED = "EXR"
export const VIA_BOARDING_NOT_REQUIRED = "NER"
export const VIA_DISEMBARKING_NOT_REQUIRED = "NXR"
export const VIA_NO_BOARDING_NOR_DISEMBARKING_REQUIRED = "NEXR"
// This is the default provided by the API with no additional context,
// but I assume it's a neutral setting not weighting anything
export const VIA_DEFAULT_BOARDING_SETTING = "EXT"
export class Station {
    /**
     * Creates a station point representation of the API.
     * @param pointType The type of the point in your trip plan. POINT_TYPE_ORIGIN if you're travelling from this location, POINT_TYPE_DESTINATION if you're
     * travelling to it, POINT_TYPE_VIA if travelling via it, and POINT_TYPE_AVOID if avoiding it.
     * @param stationId The station ID. Can be anything that accepts SLs requirements in the API spec for "ExtId".
     */
    constructor(pointType, stationId) {
        this.stationId = stationId
        this.pointType = pointType
        this.type = this.pointType === POINT_TYPE_DESTINATION ? "dest": "origin"
    }
    toObject(){
        if ([POINT_TYPE_VIA, POINT_TYPE_AVOID].includes(this.pointType)){ // Via or Avoid is not convertible to object
            throw new Error("The Station is marked as a Via or Avoid travel location. It is not convertible to an object!")
        }
        const objectRepresentation = {}
        objectRepresentation[`${this.type}ExtId`] = this.stationId
        return objectRepresentation
    }
    /**
     * If travelling via this station, this function generates a "via" parameter
     * so that you can use it with the SL API.
     * @param maxWaitTime The maximum wait time at the station.
     * @param status A status for the via. Any of the VIA_BOARDING... etc. constants.
     * @param products Any products to include. Note that you need to handle a list of products yourself as
     * the function doesn't do it for you!
     * @return {*}
     */
    generateViaString(maxWaitTime=null, status=null, products=null){
        if (this.pointType === POINT_TYPE_VIA){
            let stringRepresentation = this.stationId
            // Add any details to the string
            for (const value of [maxWaitTime, status, products]){
                // Add value and delimiter if set
                if (value !== null){
                    stringRepresentation += `|${value}`
                }
            }
            return stringRepresentation
        }
        else {
            throw new Error("You have not set the point to a via point.")
        }
    }
    /**
     * Generate a string for when the station is supposed to be avoided.
     * @param passVia Set to true if you allow passing via this station.
     * @param changeVia Set to true if you allow changing via this station.
     * @return {*} A string representation to pass to the SL API as an "avoid" parameter.
     */
    generateAvoidString(passVia=false, changeVia=false){
                if (this.pointType === POINT_TYPE_AVOID) {

                    let stringRepresentation = this.stationId
                    // Indicate to the SL API using the special strings NPAVO (do not pass)
                    // or NCAVO (do not change with), if set
                    if (passVia) {
                        stringRepresentation += "|NCAVO"
                    } else if (changeVia) {
                        stringRepresentation += "|NPAVO"
                    }
                    return stringRepresentation
                }
                else {
                    throw new Error("You have not set the point to an avoid point.")
                }
    }
}