import { queryDB } from "../lib/database.js"
import { Err, Ok } from "../lib/okay-error.js"

/** @typedef {import("./File").File_} File_ */

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
const ItemTypes = [
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
     * Creates an {@link Item} object.
     * @param {string}   name         The name of an object. E.g. title of a book.
     * @param {string}   description  A description of the object.
     * @param {string}   keywords     Commaseparated list of keywords.
     * @param {ItemType} type         The type of item.
     * @param {ItemID}   itemID       A unique identifier for the item. (In this implementation an inventory number.)
     * @param {ItemData} itemData     The item's data. Differemt for every {@link ItemType}.
     * @param {*}        customData   Custom data.
     * @returns {Ok|Err} A freshly created item embedded in an {@link Ok} or an error embedded in an {@link Err}.
     */
    create: (name, description, keywords, type, itemID, itemData, customData) => {
        // Check if name is missing.
        if (!name)
            return Err("'name' cannot be empty!")

        // Check if the type is valid.
        if (!ItemTypes.includes(type))
            return Err(`Type '${type}' is not a valid 'ItemType'!`)

        // TODO: Check if itemID is unique!
        // if (!isUniqueItemID(itemID))
        //     return Err(`ItemID '${itemID}' is not unique!`)

        const now = new Date(Date.now())

        /** @type {Item} */
        const item = {
            name,
            description,
            keywords,
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

        return Ok(item)
    },
    /**
     * Gets an {@link Item} from the database.
     * @param {itemId} itemID The {@link ItemID} of the {@link Item} to be fetched.
     * @returns
     */
    get: itemID => new Promise(
        async (resolve, reject) => {
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
     * @param {itemID} itemID The {@link ItemID} of the {@link Item} to be updated.
     * @param {*} changedData The data that should be changed.
     * @returns
     */
    update: (itemID, changedData) => {
        try {
            // update item
            return Ok("newItem")
        } catch (error) {
            return Err(error)
        }
    }
}
export default Item