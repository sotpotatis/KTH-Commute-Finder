/* caching.js
Contains utility function for caching certain information. */
import {Deta} from "deta";
import {DateTime} from "luxon";
import {getNow} from "../utils.js";
import {parseScheduleText, retrieveRawSchedule, retrieveSchedule} from "../scheduleRetrieval/retrieveSchedule.js";
import {KTHPlacesAPI} from "../kthPlacesAPI/api.js";
import {database, DATABASE_TYPE} from "../apiClients.js"
import {query} from "faunadb";
// ...and some other API interfaces
const kthPlacesAPI = new KTHPlacesAPI(import.meta.env.VITE_KTH_PLACES_API_KEY, import.meta.env.VITE_KTH_PLACES_API_USER_AGENT)

/**
 * Gets what to return from the getCachedKeys function based on how often keys should be synced.
 * @param key The key that was requested
 * @param keyData The key data that was returned from the database. Pass null or undefined if no
 * data was found.
 * @param keyReference A reference to the key in the database, not just the data
 * @param updateInterval How often the key should be updated.
 * @return {*[]|*[]}
 */
function getKeyReturnValue(key, keyData, keyReference, updateInterval){
    // Check if key exists, for each key
    if (keyData !== null && keyData !== undefined){
        // Check if they key has been cached.
        // Keys have this format:
        // {value: "", syncedAt: <unix timestamp for syncing>}
        const now = getNow()
        const syncedAtDateTime = DateTime.fromSeconds(keyData.syncedAt)
        if (DATABASE_TYPE !== "memory" && now > syncedAtDateTime.plus({minutes: updateInterval})){
            console.log(`Asking for cached key "${key}" to be updated (last synced: ${syncedAtDateTime})`)
            return [null, keyReference]
        }
        else if (DATABASE_TYPE === "memory"){ // We trust the TTL
            const keyValue = keyData.value
            if (keyValue !== undefined){
                return [keyData.value, keyReference]
            } else {
                console.log(`Asking for cached key ${key} to be updated (not existent in cache)`)
                return [null, null]
            }
        }
        else { // If the key has been recently synced
            return [keyData.value, keyReference]
        }
    }
    else {
        console.log(`Asking for cached key "${key}" to be synced (not existent in database)`)
        return [null, null]
    }
}
/**
 * Returns a cached key if it has been cached. Returns null if it has not been cached yet,
 * or if it is to be updated.
 * @param keyType The type of the keys that you are retrieving.
 * @param keys The keys to retrieve from the database.
 * @param updateInterval How often the key should be updated, in minutes. For example, for a key
 * with a cache age of two hours, pass 120. For a key with a cache age of 45 minutes, pass 45.
 * @returns An array with the value of the cached keys and for each key, its full data instance in case you would like
 * to do updates with it.
 */
export async function getCachedKeys(keyType, keys, updateInterval){
    if (keys.length === undefined){
        keys = [keys]
    }
    console.log(`Querying database for keys ${keys}...`)
    const keySearchResults = [] // See the return for information about this array format
    let keyData = null
    let keyReference = null
    if (DATABASE_TYPE !== null && DATABASE_TYPE !== "fauna"){
        for (const key of keys){
            keyData = await database.get(key)
            keyReference = keyData
            keySearchResults.push(getKeyReturnValue(key, keyData, keyReference, updateInterval))
        }

    }
    else if (DATABASE_TYPE === "fauna"){ // Use specific querying for Fauna
        // Execute the query
        const keyQueryResults = await database.query(
            /* For one key query.Map(
            query.Paginate(
                query.Match(
                    query.Index(
                        `${keyType}-keys`
                    ), requestedKey
                )
            ),
              (reference)=> query.Get(reference)
          ) */
            query.Map(
                keys,
                query.Lambda("key",
                    query.Map(
                        query.Paginate(
                            query.Match(
                                query.Index(
                                    `${keyType}-keys`
                                ),
                                query.Var("key")
                            )
                        ),
                reference=>query.Get(reference)
                    )
                ) // Man this query language... if there is a simpler way to do this do let me know please
            )
        )
        /*FaunaDB will return a search result like

        [
            {
                data: [
                    ...
                ]
            },
            {
                data: [
                    ...
                ]
            }
        ] for each key*/
        for (let i=0;i<keyQueryResults.length;i++){
            const keySearchResult = keyQueryResults[i]
            if (keySearchResult.data.length === 0){ // If no keys were found
                keyData = null
                keyReference = null
            }
            else {
                keyReference = keySearchResult.data[0]
                keyData = keyReference.data
            }
            keySearchResults.push(getKeyReturnValue(keys[i], keyData, keyReference, updateInterval))
        }
    }
    return keySearchResults
}

/**
 * Gets a cached key from the database
 * @param key The key that you are retrieving.
 * @param updateInterval See getCachedKeys.
 * @return {Promise<[null,null]|[*,null]|null[]|[*,null]>} Same as getCachedKeys.
 */
export async function getCachedKey(key, updateInterval){
    const [keyType, requestedKey] = key.split("-")
    const keySearchResult = await getCachedKeys(keyType, [requestedKey], updateInterval)
    return keySearchResult[0]
}
/**
 * Updates a cached key in the database.
 * @param keyType The type of the key, for example "kthPlace".
 * @param key The name of the key to update.
 * @param previousKeyInstance A previous instance of the key if any. See the return
 * from getCachedKey for more information.
 * @param newValue The new value of the key.
 * @param ttl TTL if any. Supported with Node-cache. Value in minutes.
 * @return {Promise<void>}
 */
export async function setCachedKey(keyType, key, previousKeyInstance, newValue, ttl){
    const fullKey = `${keyType}-${key}`
    newValue.key = key
    if (DATABASE_TYPE  === "deta"){ // (caching is only enabled in production)
        await database.put(fullKey, newValue)
    }
    else if (DATABASE_TYPE === "memory"){
        if (ttl !== undefined && ttl !== null){
            ttl = ttl * 60 // Node-Cache uses TTL value in seconds, but value is in minutes
        }
        await database.set(fullKey, newValue, ttl) // Node-Cache supports TTL(!)
    }
    else if (DATABASE_TYPE === "fauna"){
        let databaseQuery = null
        if (previousKeyInstance !== null){ // If existent in database
            databaseQuery = query.Update(previousKeyInstance.ref, {data: newValue})
        }
        else {
            databaseQuery = query.Create(query.Collection(keyType),{data: newValue})
        }
        await database.query(databaseQuery)
    }
    console.log(`Data for ${fullKey} successfully updated and stored in cache (sync time: ${DateTime.fromSeconds(newValue.syncedAt)}).`)
}
/**
 * Shortcut function to get the data of a room. If it is not in the cache, an update is requested.
 * @param roomName The room name to get data for.
 * @return {Promise<void>} The data for the room if found, otherwise returns null.
 * Make sure to handle that edge case in your API!
 */
const KTH_ROOMS_UPDATE_INTERVAL = 240 // How often (in minutes) to sync new room data from the KTH servers
export async function getRoomsData(roomNames){
    // First, check if we have cached data
    // Trim whitespace from room name - this might be the reason that requests fail
    let allRoomDatabaseKeys = []
    let allRoomNames = []
    for (const roomName of roomNames){
        const roomDatabaseKey = `kthPlace-${roomName}`
        allRoomDatabaseKeys.push(roomDatabaseKey)
        allRoomNames.push(roomName)
    }
    let roomDatas = {}
    const cachedKeysResults = await getCachedKeys("kthPlace", allRoomNames, KTH_ROOMS_UPDATE_INTERVAL)
    for (let i=0;i<cachedKeysResults.length;i++){
        const [cachedKeyValue, cachedKey] = cachedKeysResults[i]
        let roomData = null
        const roomName = allRoomNames[i]
        if (cachedKeyValue === null){
            // If we should re-sync stuff
            console.log(`Getting room ${roomName} from KTH API...`)
            try {
                roomData = await kthPlacesAPI.findRoom(roomName)
                if (roomData !== null){
                    console.log(`Room information retrieved.`)

                }
                else {
                    console.warn(`Failed to get room data for ${roomName}: No room found!`)
                    roomData = null
                }
                const newCachedKeyValue = {
                        value: JSON.stringify(roomData),
                        syncedAt: getNow().toUnixInteger()
                    }
                if (DATABASE_TYPE !== null){
                    await setCachedKey("kthPlace", roomName, cachedKey, newCachedKeyValue, KTH_ROOMS_UPDATE_INTERVAL)
                }
            }
            catch (e) {
                console.warn(`Failed to get room data for ${roomName}: Exception ${e} occurred.`)
                roomData =  null
            }
        }
        else { // Load room data from cache
            console.log("Returning cached room data...")
            roomData = JSON.parse(cachedKeyValue)
        }
        if (roomData !== null){
            roomData.roomName = roomName // This is interestingly enough not always straightforward from the KTH API returns
        }
        roomDatas[roomName] = roomData
    }
    return roomDatas
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
    let [cachedKeyValue, cachedKey] = await getCachedKey(scheduleDatabaseKey, KTH_SCHEDULE_UPDATE_INTERVAL)
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
                    await setCachedKey("kthSchedule", scheduleURL, cachedKey, cachedKeyValue, KTH_SCHEDULE_UPDATE_INTERVAL)
                    console.log(`Schedule data successfully updated and stored in cache.`)
                }
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

