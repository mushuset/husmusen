import { existsSync } from "fs"
import { readFile, writeFile } from "fs/promises"
import YAML from "yaml"

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

/**
 * Caches DBInfo read from `./data/db_info.yml` to {@link dbinfoCache}
 * @returns {void}
 */
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
    /**
     * Gets the DBInfo...
     * @returns {DBInfo}
     */
    get: () => new Promise(
        async (resolve, reject) => {
            // If there is no cache, generate it...
            if (!dbinfoCache)
                await cacheDBInfo().catch(reject)

            resolve(dbinfoCache)
        }
    ),
    /**
     * Saves new DBInfo...
     * @param {DBInfo} DBInfo The new DBInfo
     * @returns {Promise}
     */
    // TODO: This should probably be checked so it is valid!
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