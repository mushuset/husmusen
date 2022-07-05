import { Err, Ok } from "../lib/okay-error.js"

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

/**
 * @typedef {object} File_
 * @property {string}   name        E.g. a title of a book.
 * @property {FileType} type        MIME type of a file. E.g. 'image/png'
 * @property {string}   license     File license.
 * @property {ItemID}   itemID      Unique identifier for the database.
 * @property {Date}     addedAt     When the file was added.
 * @property {ItemID}   relatedItem {@link ItemID} for related the related {@link Item}.
 */

export const Item = {
    /**
     * Creates an {@link Item} object.
     * @param {string}   name
     * @param {string}   description
     * @param {string}   keywords
     * @param {ItemType} type
     * @param {ItemID}   itemID
     * @param {ItemData} itemData
     * @param {*}        customData
     * @returns {Ok|Err} A freshly created item
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

        /** @type {Item} */
        const item = {
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        }

        return Ok(item)
    }
}