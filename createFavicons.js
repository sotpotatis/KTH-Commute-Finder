/* createFavicons.js
Helper script to create favicons for the app.
 */
// Imports
const fs = require("fs")
const path = require("path")
const favicons = require("favicons")
// Settings
const FAVICON_INPUT_FILE = "./static/favicon.png"
const FAVICON_OUTPUT_DIRECTORY = "./static/"
const FAVICON_CONFIGURATIONS = {
    appName: "KTH Commute Finder",
    appDescription: "Koppla ihop ditt KTH-schema med SL-resor och hitta den perfekta resan för dig!",
    display: "fullscreen",
    lang: "sv-SE",
    background: "#1b2432",
    theme_color: "#1f2937"
}
console.log("Creating favicons...")
const response = await favicons(FAVICON_INPUT_FILE, FAVICON_CONFIGURATIONS)
console.log(`Generated ${response.files.length} favicon files.`)
for (const faviconFile of response.files){
    const targetFilePath = path.join(FAVICON_OUTPUT_DIRECTORY, faviconFile.name)
    console.log(`Saving generated file ${targetFilePath}...`)
    fs.writeFileSync(
        targetFilePath,
        faviconFile.contents
    )
}
