/* caching.js
Contains utility function for caching certain information. */
import {Deta} from "deta";
import {DateTime} from "luxon";
import {getNow} from "../utils.js";
import {parseScheduleText, retrieveRawSchedule, retrieveSchedule} from "../scheduleRetrieval/retrieveSchedule.js";
import {KTHPlacesAPI} from "../kthPlacesAPI/api.js";
import {database, DATABASE_TYPE} from "../apiClients.js"
// ...and some other API interfaces
const kthPlacesAPI = new KTHPlacesAPI(import.meta.env.VITE_KTH_PLACES_API_KEY, import.meta.env.VITE_KTH_PLACES_API_USER_AGENT)
/**
 * Returns a cached key if it has been cached. Returns null if it has not been cached yet,
 * or if it is to be updated.
 * @param key The key to retrieve from the database.
 * @param updateInterval How often the key should be updated, in minutes. For example, for a key
 * with a cache age of two hours, pass 120. For a key with a cache age of 45 minutes, pass 45.
 */
export async function getCachedKey(key, updateInterval){
    const keyData = database !== null ? await database.get(key): null
    // Check if key exists
    if (keyData !== null && keyData !== undefined){
        // Check if they key has been cached.
        // Keys have this format:
        // {value: "", syncedAt: <unix timestamp for syncing>}
        const now = getNow()
        const syncedAtDateTime = DateTime.fromSeconds(keyData.syncedAt)
        // Only Deta requires caching. The other database types have it built-in.
        if (DATABASE_TYPE === "deta" && now > syncedAtDateTime.plus({minutes: updateInterval})){
            console.log(`Asking for cached key "${key}" to be updated (last synced: ${syncedAtDateTime})`)
            return null
        }
        else if (DATABASE_TYPE === "memory"){
            return keyData.value !== undefined ? keyData.value : null
        }
        else { // If the key has been recently synced
            return keyData.value
        }
    }
    else {
        console.log(`Asking for cached key "${key}" to be synced (not existent in database)`)
        return null
    }
}
/**
 * Shortcut function to get the data of a room. If it is not in the cache, an update is requested.
 * @param roomName The room name to get data for.
 * @return {Promise<void>} The data for the room if found, otherwise returns null.
 * Make sure to handle that edge case in your API!
 */
const KTH_ROOMS_UPDATE_INTERVAL = 240 // How often (in minutes) to sync new room data from the KTH servers
export async function getRoomData(roomName){
    // First, check if we have cached data
    roomName = roomName.trim() // Trim whitespace from room name - this might be the reason that requests fail
    const roomDatabaseKey = `kthPlace-${roomName}`
    let cachedKeyValue = await getCachedKey(roomDatabaseKey, KTH_ROOMS_UPDATE_INTERVAL)
    let roomData = null
    if (cachedKeyValue === null){
        // If we should re-sync stuff
        console.log(`Getting room ${roomName} from KTH API...`)
        try {
            roomData = await kthPlacesAPI.findRoom(roomName)
            if (roomData !== null){
                console.log(`Room information retrieved. Updating cache...`)
                cachedKeyValue = {
                    value: JSON.stringify(roomData),
                    syncedAt: getNow().toUnixInteger()
                }
                console.log(`Stored room information for ${roomName}.`)
                if (DATABASE_TYPE !== null){
                    if (DATABASE_TYPE  === "deta"){ // (caching is only enabled in production)
                        await database.put(roomDatabaseKey, cachedKeyValue)
                    }
                    else if (DATABASE_TYPE === "memory"){
                        await database.set(roomDatabaseKey, cachedKeyValue, KTH_ROOMS_UPDATE_INTERVAL*60) // Node-Cache supports TTL(!)
                    }
                    console.log(`Room data for ${roomName} successfully updated and stored in cache.`)
                }
            }
            else {
                console.warn(`Failed to get room data for ${roomName}: No room found!`)
                return null
            }
        }
        catch (e) {
            console.warn(`Failed to get room data for ${roomName}: Exception ${e} occurred.`)
            return null
        }
    }
    else { // Load room data from cache
        console.log("Returning cached room data from the cache...")
        roomData = JSON.parse(cachedKeyValue)
    }
    return roomData
}
const KTH_SCHEDULE_UPDATE_INTERVAL = 120 // How often (in minutes) to sync new user schedules from the KTH servers
/**
 * Shortcut function to get the data of a user schedule. If it is not in the cache, an update is requsted.
 * @param scheduleURL The schedule URL to get the data for.
 * @return {Promise<void>} null if the schedule does not exist in the cache and we failed to retrieve it,
 * the schedule data otherwise.
 */
export async function getCachedSchedule(scheduleURL){
    // First, check if we have cached data
    const scheduleDatabaseKey = `kthSchedule-${scheduleURL}`
    let cachedKeyValue = await getCachedKey(scheduleDatabaseKey, KTH_SCHEDULE_UPDATE_INTERVAL)
    let rawScheduleData = null
    if (cachedKeyValue === null){
        // If we should re-sync stuff
        console.log(`Getting schedule from KTH API...`)
        try {
            rawScheduleData = await retrieveRawSchedule(scheduleURL)
            if (rawScheduleData === null){
                return null
            }
            else {
                console.warn(`Failed to get a raw schedule: Got null back from the retrieval function!`)
            }
            const scheduleData = await parseScheduleText(rawScheduleData)
            if (scheduleData !== null){
                console.log(`Schedule information retrieved. Updating cache...`)
                cachedKeyValue = {
                    value: rawScheduleData,
                    syncedAt: getNow().toUnixInteger()
                }
                if (DATABASE_TYPE !== null){
                    if (DATABASE_TYPE  === "deta"){ // (caching is only enabled in production)
                        await database.put(scheduleDatabaseKey, cachedKeyValue)
                    }
                    else if (DATABASE_TYPE === "memory"){
                        await database.set(scheduleDatabaseKey, cachedKeyValue, KTH_SCHEDULE_UPDATE_INTERVAL*60) // Node-Cache supports TTL(!)
                    }
                    console.log(`Schedule data successfully updated and stored in cache.`)
                }
                console.log(`Schedule successfully updated and stored in cache.`)
            }
            else {
                console.warn(`Failed to get a schedule: Got null back from the retrieval function!`)
                return null
            }
        }
        catch (e) {
            console.warn(`Failed to get a schedule: Exception ${e} occurred.`)
            return null
        }
    }
    else { // Load raw schedule data from cache
        console.log("Loading schedule data from cache...")
        rawScheduleData = cachedKeyValue
    }
    return parseScheduleText(rawScheduleData)
}

