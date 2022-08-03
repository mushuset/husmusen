import { randomUUID } from "crypto"
import { writeFile } from "fs/promises"
import { queryDB } from "../lib/database.js"

/** @typedef {import("./Item").Item}   Item */
/** @typedef {import("./Item").ItemID} ItemID */

/** @typedef {string} FileID a UUID.*/

/**
 * @typedef {object} File_
 * @property {string}   name        E.g. a title and episode of a radio programme.
 * @property {FileType} type        MIME type of a file. E.g. 'image/png'
 * @property {string}   license     File license.
 * @property {FileID}   fileID      Unique identifier for the database.
 * @property {Date}     addedAt     When the file was added.
 * @property {Date}     updatedAt   When the file was last updated.
 * @property {ItemID}   relatedItem {@link ItemID} for related the related {@link Item}.
 */

const File = {
    /**
     * Creates a file object.
     * @param {string} name
     * @param {string} type
     * @param {string} license
     * @param {ItemID} relatedItem The `ItemID` of the {@link Item} the file belongs to.
     * @returns {Promise<File_>} A freshly created file.
     */
    create: (name, type, license, relatedItem) => new Promise(
        (resolve, reject) => {
            // Make sure the properties are defined...
            if (!name)
                return reject("'name' cannot be empty!")

            if (!type)
                return reject("'type' cannot be empty!")

            if (!license)
                return reject("You must specify a license!")

            if (!license)
                return reject("You must specify a 'relatedItem'!")

            const now = new Date(Date.now())
            const file = {
                name,
                type,
                license,
                fileID: randomUUID(),
                addedAt: now,
                addedAt: now,
                relatedItem
            }

            resolve(file)
        }
    ),
    /**
     * Gets a file from the database.
     * @param {FileID} fileID The {@link FileID} to find in the database.
     * @returns {Promise<File_>}
     */
    get: fileID =>  queryDB(
        "SELECT * FROM husmusen_files WHERE fileID = ?",
        [ fileID ],
        true
    ),
    /**
     * Saves file (metadata information) to the database.
     * @param {File_} file The {@link File_ File metadata information}.
     * @returns {Promise<File_>}
     */
    save: file => new Promise(
        (resolve, reject) => {
            queryDB(
                `
                    INSERT INTO husmusen_files (
                        name,
                        type,
                        license,
                        fileID,
                        addetAt,
                        updatedAt,
                        relatedItem
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?
                    )
                `,
                [
                    file.name,
                    file.type,
                    file.license,
                    file.fileID,
                    file.addedAt,
                    file.updatedAt,
                    file.relatedItem
                ]
            ).then(() => resolve(file)).catch(reject)
        }
    ),
    /**
     * **NOT IMPLEMENTED!!!** Updates a file in the database with new metadata information.
     * @param {FileID} fileID The {@link FileID} of the file to change
     * @param {File_} changedData The new file data.
     * @returns {Promise<File_>}
     */
    update: (fileID, name, type, license, relatedItem) => new Promise(
        (resolve, reject) => {
            if (!name)
                return reject("'name' cannot be empty!")

            if (!type)
                return reject("'type' cannot be empty!")

            if (!license)
                return reject("You must specify a license!")

            if (!license)
                return reject("You must specify a 'relatedItem'!")

            const now = new Date(Date.now())

            queryDB(
                `
                    UPDATE husmusen_files SET
                        name,
                        type,
                        license,
                        updatedAt,
                        relatedItem
                    WHERE fileID = ?
                `,
                [
                    name,
                    type,
                    license,
                    now,
                    relatedItem,
                    fileID
                ]
            )
                .then(() => File.get(fileID))
                .then(resolve)
                .catch(reject)
        }
    ),
    /**
     * Delets a file from the database
     * @param {FileID} fileID The {@link FileID} of the file to delete.
     * @returns {Promise}
     */
    // TODO: This function and functions alike it returns a Promise to simply pass it on via resolve and reject.
    //       It could be changed to just return the Promise directly and skip 'passing it on'...
    // TODO: Make sure this also deletes the file from the uploads folder.
    delete: fileID => new Promise(
        (resolve, reject) => queryDB(
            "DELETE FROM husmusen_files WHERE fileID = ?",
            [ fileID ]
        ).then(resolve).catch(reject)
    )
}

export default File