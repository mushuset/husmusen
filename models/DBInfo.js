import YAML from "yaml"
import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"

const DBINFO_FILE_PATH = "./data/db_info.yml"

/**
 * @typedef {("application/yaml"|"application/json")} TransferFormat
 */

/**
 * @typedef {object} DBInfo
 * @property {string}                protocolVersion
 * @property {Array<TransferFormat>} protocolVersions
 * @property {Array<TransferFormat>} supportedInputFormats
 * @property {Array<TransferFormat>} supportedOutputFromats
 * @property {string}                instanceName
 * @property {string}                apiUrl
 * @property {MuseumDetails}         museumDetails
*/

/**
 * @typedef {object} MuseumDetails
 * @property {string} name
 * @property {string} description
 * @property {string} address
 * @property {string} location
 * @property {string} coordinates
 * @property {string} website
 */

/**
 * @type {null|DBInfo}
 */
let dbinfoCache = null

function cacheDBInfo() {
    return new Promise(
        async (resolve, reject) => {
            if (!existsSync(DBINFO_FILE_PATH))
                await writeFile(DBINFO_FILE_PATH, "").catch(reject)

            readFile(DBINFO_FILE_PATH)
                .then(fileData => fileData.toString())
                .then(DBInfoYAML => dbinfoCache = YAML.parse(DBInfoYAML))
                .then(resolve)
                .catch(reject)
        }
    )
}

const DBInfo = {
    get: () => new Promise(
        async (resolve, reject) => {
            if (!dbinfoCache)
                await cacheDBInfo().catch(reject)

            resolve(dbinfoCache)
        }
    ),
    save: DBInfo => new Promise(
        (resolve, reject) => {
            const DBInfoYAML = YAML.stringify(DBInfo)

            writeFile(DBINFO_FILE_PATH, DBInfoYAML)
                .then(() => {
                    cacheDBInfo()
                    resolve()
                })
                .catch(reject)
        }
    )
}
 export default DBInfo