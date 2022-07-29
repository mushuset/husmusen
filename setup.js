import colors from "colors"
import { writeFile, mkdir } from "fs/promises"
import { existsSync } from "fs"

const log = (...args) => console.log(colors.yellow("SETUP |"), ...args)
const err = err => log(colors.red("ERROR!"), err)

log("Setting up some initial things...")

if (!existsSync("./data"))
    await mkdir("./data").catch(err)

if (!existsSync("./data/files"))
    await mkdir("./data/files").catch(err)

if (!existsSync("./data/db_info.yml"))
    await writeFile("./data/db_info.yml", `\
protocolVersion: "1.0.0"
protocolVersions: [ "1.0.0" ]
supportedInputFormats: [ "application/yaml", "application/json" ]
supportedOutputFormats: [ "application/yaml", "application/json" ]
instanceName: "Husmusen på Museum"
museumDetails:
  name: "Museum"
  description: "Ett helt vanligt museum."
  address: "Gatanvägen 4"
  location: "Kungshamn"
  coordinates: "0°0′0″ N, 25°0′0″ W"
  website: "https://example.com"
`).catch(err)

if (!existsSync("./data/keywords.txt"))
    await writeFile("./data/keywords.txt", "").catch(err)

log("Initial setup should be done!")