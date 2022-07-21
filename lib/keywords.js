import { queryDB } from "./database.js"
import { ItemTypes } from "../models/Item.js"

/**
 * Returns a promise with keywords used in the database. Resolves with all keywords or rejects with an error.
 * @param {Array<import("../models/Item.js").ItemType>} types The types to get the keywords for. If left empty/undefined, all keywords for all types will be returned.
 * @returns {Promise}
 */
export default function getKeywords(types) {
    return new Promise(
        (resolve, reject) => {
            const typeSearchSQL = (types ?? [])[0] ? types.filter(type => ItemTypes.includes(type)) : ItemTypes
        
            queryDB(
                "SELECT DISTINCT keywords FROM husmusen_items WHERE type IN (?)",
                [ typeSearchSQL ]
            ).then(
                /**
                 * @param {Array} result Array of the results.
                 */
                result => {
                    const keywords = result
                        .map(e => e.keywords.split(","))
                        .flat()
                        // Get only unique values.
                        .filter((value, index, array) => array.indexOf(value) === index)

                    resolve(keywords)
                }
            ).catch(reject)
        }
    )
}
