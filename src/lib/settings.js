/* settings.js
* There are a bunch of settings that can be set by the user. Some are mandatory and some are not.
* This library contains some small utility functions to help with that.
* Note: settings are stored in the local storage. */
import {removeItemFromList} from "./utils.js";
 import { browser } from '$app/environment';
const USER_SETTINGS_LOCAL_STORAGE_KEY = "userSettings"
const DEFAULT_USER_SETTINGS = {
    scheduleURL: null
}
/**
 * Gets all the settings that has been stored for a user.
 * @return {null|any} Null if there are stored settings, otherwise the settings data.
 */
export function getUserSettings(){
    try {
        const userSettingsValue = browser && localStorage.getItem(USER_SETTINGS_LOCAL_STORAGE_KEY)
        if (userSettingsValue !== null) {
            console.log("Loaded user settings from local storage:", userSettingsValue)
            return JSON.parse(userSettingsValue)
        }
    }
    catch (e) {
        console.warn(`Could not load user settings: ${e}. Will return empty settings!`)
        return {}
    }
    return {}
}
/**
 * Function to update user settings.
 * @param newSettingsValue The new settings value to write.
 */
export function updateUserSettings(newSettingsValue){
    if (browser){localStorage.setItem(USER_SETTINGS_LOCAL_STORAGE_KEY, JSON.stringify(newSettingsValue))
    console.log("⚙️User settings updated to: ", newSettingsValue)}
}

/**
 * Set a certain key in the user settings to a certain value.
 * Note: for nested attributes, make sure to provide the whole object!
 * @param settingsKey The key to update.
 * @param keyValue The new value to set it to.
 * @returns The updated user settings.
 */
export function setSetting(settingsKey, keyValue){
    let currentUserSettings = getUserSettings()
    if (currentUserSettings === null){
        console.warn("Writing default user settings!")
        currentUserSettings = DEFAULT_USER_SETTINGS
    }
    currentUserSettings[settingsKey] = keyValue
    updateUserSettings(currentUserSettings)
    return currentUserSettings
}
export function getSetting(settingsKey){
    let currentUserSettings = getUserSettings()
    if (currentUserSettings === null){
        return null
    }
    else { // Return the current value of the setting if it exists
        return settingIsSet(currentUserSettings, settingsKey) ? currentUserSettings[settingsKey] : null
    }
}

/**
 * Quick function to check if a certain setting has been set.
 * @param settings The current user settings.
 * @param requestedSetting The value to check existence for.
 * @returns boolean true if the setting exists (is not null or undefined), otherwise false.
 */
export function settingIsSet(settings, requestedSetting){
    return ![undefined, null].includes(settings[requestedSetting])
}
// This defines a custom store-like for the local storage method that we can use in Svelte to easily handle reactivity etc.
// The store implementation is implemented according to the description here:
// https://svelte.dev/docs/svelte-components#script-4-prefix-stores-with-$-to-access-their-values
export class Settings {
    /**
     * Implements a local-storage-synced settings object.
     */
    constructor() {
        this.currentValue = getUserSettings()
        this.subscribedFunctions = [] // Store subscribed functions. Svelte subscribes to this store using those.
        this.announceChanges(this.currentValue)
    }
    /**
     * Because of JavaScript, you have to use a Proxy to define a custom getter function so you can access subkeys
     * like this: settings.subkey. This function helps with that.
     */
    getProxy(){
        return new Proxy(new Settings(), {
            get: (target, property)=>{
                if (target[property] !== undefined){
                    return target[property]
                }
                else {
                    return settingIsSet(target.currentValue, property) ? target.currentValue[property] : null
                }
            }
        })
    }
    /**
     * Announces that the value has changed to all the current subscribed functions.
     */
    announceChanges(){
        console.debug(`Announcing changes to ${this.subscribedFunctions.length} subscribed functions...`)
        const newValue = this.currentValue
        for (const subscribedFunction of this.subscribedFunctions){
            subscribedFunction(newValue)
        }
    }
    loadFromLocalStorage(){
        this.currentValue = getUserSettings()
        this.announceChanges(this.currentValue)
    }
    // Svelte-required methods
    subscribe(subscriptionFunction){
        this.subscribedFunctions.push(subscriptionFunction)
        return () => { // Return a function to unsubscribe.
            removeItemFromList(this.subscribedFunctions, subscriptionFunction)
        }
    }
    set (value){
        updateUserSettings(value)
        this.loadFromLocalStorage()
        this.announceChanges()
    }
    // Helper methods.
    /**
     * Get a setting key.
     * @param settingKey The setting key to get.
     * @param defaultValue Any default value that will be returned if the setting doesn't exist. Otherwise, we will return null.
     */
    get(settingKey, defaultValue){
        // Fill out defaults
        if (defaultValue === undefined){
            defaultValue = null
        }
        if (settingIsSet(this.currentValue, settingKey)){
            return this.currentValue[settingKey]
        }
        else {
            return defaultValue
        }
    }
    /**
     * Set a setting key
     * @param settingKey The setting key to set.
     * @param newValue The value to set the setting key to.
     */
    setSetting(settingKey, newValue){
        setSetting(settingKey, newValue)
        this.loadFromLocalStorage()
        this.announceChanges()
    }

    /**
     * Updates an object setting. If the object already exists,
     * then the key is added to the object. Otherwise, a new object is created.
     * @param settingKey The setting key to set.
     * @param keysToAppend The key(s) to set for the object.
     */
    setObjectSetting(settingKey, keysToAppend){
        let settingValue = this.get(settingKey)
        if (settingValue === null){
            settingValue = {} // Create new object if setting is not set
        }
        // Add all the values
        for (const [key, value] of Object.entries(keysToAppend)){
            settingValue[key] = value
        }
        setSetting(settingKey, settingValue)
    }
}
