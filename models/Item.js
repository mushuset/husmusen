import { queryDB } from "../lib/database.js"
import Keyword from "./Keyword.js"

/** @typedef {import("./File").File_} File_ */
/** @typedef {import("./Keyword.js").Keyword} Keyword */

/**
 * A unique identifier for {@link Item}. (In this implementation an inventory number.)
 * @typedef {number} ItemID
 */

/**
 * All the different types of items that can exist in the database.
 * @typedef {(
 *   "ArtPiece"            |
 *   "Blueprint"           |
 *   "Book"                |
 *   "Building"            |
 *   "Collection"          |
 *   "Concept"             |
 *   "CulturalEnvironment" |
 *   "CulturalHeritage"    |
 *   "Document"            |
 *   "Exhibition"          |
 *   "Film"                |
 *   "Group"               |
 *   "HistoricalEvent"     |
 *   "InteractiveResource" |
 *   "PhysicalItem"        |
 *   "Map"                 |
 *   "Organisation"        |
 *   "Person"              |
 *   "Photo"               |
 *   "Sketch"              |
 *   "Sound"
 * )} ItemType
 */

/** @type {Array<ItemType>} */
export const ItemTypes = [
    "ArtPiece",
    "Blueprint",
    "Book",
    "Building",
    "Collection",
    "Concept",
    "CulturalEnvironment",
    "CulturalHeritage",
    "Document",
    "Exhibition",
    "Film",
    "Group",
    "HistoricalEvent",
    "InteractiveResource",
    "PhysicalItem",
    "Map",
    "Organisation",
    "Person",
    "Photo",
    "Sketch",
    "Sound"
]

/**
 * A museum item for the database.
 * @typedef {object} Item
 * @property {string}       name         The name of an object. E.g. title of a book.
 * @property {string}       description  A description of the object.
 * @property {string}       keywords     Commaseparated list of keywords.
 * @property {ItemType}     type         The type of item.
 * @property {ItemID}       itemID       A unique identifier for the item. (In this implementation an inventory number.)
 * @property {Date}         addedAt      Date and time when the item got added to the database.
 * @property {Date}         updatedAt    Date and time when the item last got updated/edited.
 * @property {ItemData}     itemData     The item's data. Differemt for every {@link ItemType}
 * @property {*}            customData   Custom data.
 * @property {boolean}      isExpired    Wheter or not the item has *expired*. E.g. gotten lost or destroyed.
 * @property {string}       expireReason The reason it got *expired*. E.g. it broke or disapeared.
 * @property {boolean}      hasThumbnail Whether ot not the item has a thumbnail image.
 * @property {Array<File_>} itemFiles    A list of {@link File_ Files} related to the item.
 */

const Item = {
    /**
     * Creates a promise of an {@link Item}.
     * @param {string}   name         The name of an object. E.g. title of a book.
     * @param {string}   description  A description of the object.
     * @param {string}   keywords     Commaseparated list of keywords.
     * @param {ItemType} type         The type of item.
     * @param {ItemID}   itemID       A unique identifier for the item. (In this implementation an inventory number.)
     * @param {ItemData} itemData     The item's data. Differemt for every {@link ItemType}.
     * @param {*}        customData   Custom data.
     * @returns {Promise<Item>} Resolves with an {@link Item} or rejects with an error.
     */
    create: (name, description, keywords, type, itemID, itemData, customData) => new Promise(
        async (resolve, reject) => {
            // Check if name is missing.
            if (!name)
                return reject("'name' cannot be empty!")

            // Check if the type is valid.
            if (!ItemTypes.includes(type))
                return reject(`Type '${type}' is not a valid 'ItemType'!`)

            // Check if keywords are valid.
            const allKeywordsForType = (await Keyword.get([ type ])).map(keyword => keyword.word)
            const validKeywords = keywords
                .split(",")
                .filter(keyword => allKeywordsForType.includes(keyword))
                // Make sure there are no duplicates.
                .filter((keyword, index, array) => array.indexOf(keyword) === index)
                // Sort in alphabetical order.
                .sort((a, b) => a.localeCompare(b))
                // Join back to a comma-separated string.
                .join(",")

            const now = new Date(Date.now())

            /** @type {Item} */
            const item = {
                name,
                description,
                keywords: validKeywords,
                type,
                itemID,
                addedAt: now,
                updatedAt: now,
                itemData: itemData ?? {},
                customData: customData ?? {},
                isExpired: false,
                expireReason: "",
                itemFiles: []
            }

            resolve(item)
        }
    ),
    /**
     * Gets an {@link Item} from the database.
     * @param {ItemID} itemID The {@link ItemID} of the {@link Item} to be fetched.
     * @returns
     */
    get: itemID => new Promise(
        (resolve, reject) => {
            queryDB(
                "SELECT * FROM husmusen_items WHERE itemID = ?",
                [ itemID ],
                true
            ).then(
                result => {
                    if (!result)
                        reject("NO_EXISTS")

                    resolve(result)
                }
            ).catch(reject)
        }
    ),
    /**
     * Saves an {@link Item} to the database.
     * @param {Item} item The item to be saved.
     */
    save: item => new Promise(
        async (resolve, reject) => {
            queryDB(
                `
                    INSERT INTO husmusen_items (
                        name,
                        description,
                        keywords,
                        type,
                        itemID,
                        addedAt,
                        updatedAt,
                        itemData,
                        customData,
                        isExpired,
                        expireReason
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `, [
                    item.name,
                    item.description,
                    item.keywords,
                    item.type,
                    item.itemID,
                    item.addedAt,
                    item.updatedAt,
                    JSON.stringify(item.itemData),
                    JSON.stringify(item.customData),
                    item.isExpired,
                    item.expireReason
                ],
                true
            ).then(
                () => resolve(item)
            ).catch(reject)
        }
    ),
    /**
     * Update an {@link Item} in the database.
     * @param {ItemID} itemID The {@link ItemID} of the {@link Item} to be updated.
     * @param {*} changedData The data that should be changed.
     * @returns
     */
    update: (itemID, changedData) => {
        // NOT IMPLEMETED!
        return { itemID, changedData }
    },
    /**
     * Marks an {@link Item} as expired.
     * @param {ItemID} itemID The {@link ItemID} of the item to mark as expired.
     * @param {string} reason The reason for marking it as expired.
     * @returns {Promise} Resolves on success, rejects on error.
     */
    mark: (itemID, reason) => new Promise(
        (resolve, reject) => {
            queryDB(
                `
                    UPDATE husmusen_items
                        SET isExpired = 1, expireReason = ?
                        WHERE itemID = ?
                `,
                [ reason, itemID ]
            ).then(resolve).catch(reject)
        }
    ),
    /**
     * Deletes an item from the database.
     * @param {ItemID} itemID The {@link ItemID} of the item to delete.
     * @returns {Promise} Resolves on success, rejects on error.
     */
    delete: itemID => new Promise(
        (resolve, reject) => {
            queryDB(
                "DELETE FROM husmusen_items WHERE itemID = ?",
                [ itemID ]
            ).then(resolve).catch(reject)
        }
    )
}
export default Item