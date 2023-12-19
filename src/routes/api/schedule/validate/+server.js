/* api/schedule/validate/+page.server.js
This endpoint is used to validate that a KTH schedule link can be accessed and parsed.
*/
import {json} from "@sveltejs/kit";
import {
    API_STATUS_ERROR, API_STATUS_OK,
    generateResponse,
    MISSING_REQUIRED_ARGUMENTS,
    SCHEDULE_RETRIEVAL_ERROR_RESPONSE,
    validateURLParameters
} from "../../utilities.js";
import {retrieveSchedule} from "../../../../lib/scheduleRetrieval/retrieveSchedule.js";

import {
    page
} from "$app/stores"
export async function GET({request}){
    console.log("Got a request to /api/schedule/validate.")
    // Validate that parameters exist
    const [urlParametersValid, urlParameters] = validateURLParameters(["scheduleURL"], request)
    if (urlParametersValid){
        try {
            console.log("Retrieving schedule URL...")
            const scheduleURL = new URL(urlParameters.get("scheduleURL"))
            if (!scheduleURL.hostname.includes("kth")){
                console.log("Schedule URL does not include KTH. Returning error...")
                return SCHEDULE_RETRIEVAL_ERROR_RESPONSE()
            }
            const schedule = await retrieveSchedule(scheduleURL)
            // Check if we get something valid back from the schedule retrieval function
            if (schedule !== null){
                console.log("Schedule retrieved and parsed. Validation passed.")
                return generateResponse(API_STATUS_OK, {
                    success: true
                })
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
        console.log("Missing required arguments. Returning error...")
        return MISSING_REQUIRED_ARGUMENTS()
    }
}