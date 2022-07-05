import { Err, Ok } from "../lib/okay-error"
import { randomUUID } from "crypto"

/** @typedef {import("./Item").ItemID} ItemID */
/** @typedef {import("./Item").Item}   Item */

/**
 * @typedef {object} File_
 * @property {string}   name        E.g. a title and episode of a radio programme.
 * @property {FileType} type        MIME type of a file. E.g. 'image/png'
 * @property {string}   license     File license.
 * @property {ItemID}   itemID      Unique identifier for the database.
 * @property {Date}     addedAt     When the file was added.
 * @property {ItemID}   relatedItem {@link ItemID} for related the related {@link Item}.
 */

const File = {
    /**
     * Creates a file object.
     * @param {string} name
     * @param {string} type
     * @param {string} license
     * @param {ItemID} relatedItem The `ItemID` of the {@link Item} the file belongs to.
     * @returns {Ok|Err} A freshly created file.
     */
    create: (name, type, license, relatedItem) => {
        if (!name)
            return Err("'name' cannot be empty!")

        if (!type)
            return Err("'type' cannot be empty!")

        if (!license)
            return Err("You must specify a license!")

        if (!license)
            return Err("You must specify a 'relatedItem'!")

        const file = {
            name,
            type,
            license,
            itemID: randomUUID(),
            addedAt: new Date(Date.now()),
            relatedItem
        }

        return Ok(file)
    }
}

export default File