import fs from "fs/promises"
import YAML from "yaml"

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
 * Returns a promise resolving with the DBInfo or rejecting with an error.
 * @returns {Promise<DBInfo>}
 */
export default function getDBInfo() {
    return new Promise(
        (resolve, reject) => {
            fs.readFile("./config/db_info.yml")
                .then(file   => file.toString())
                .then(dbInfo => resolve(YAML.parse(dbInfo)))
                .catch(reject)
        }
    )
}