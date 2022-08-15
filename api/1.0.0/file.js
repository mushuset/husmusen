import { Router } from "express"
import { existsSync } from "fs"
import { rm, writeFile } from "fs/promises"
import path from "path"
import authHandler from "../../lib/authHandler.js"
import getLogger from "../../lib/log.js"
import HusmusenError from "../../models/Error.js"
import File from "../../models/File.js"

const fileApi = Router()

const log = getLogger("Database |", "magenta")

fileApi.get(
    "/get/:id",
    (req, res) => {
        const sanitisedItemID = req.params.id
            // Make sure to remove the file extension...
            .replace(/\.\w+$/, "")
            // Also remove any non-hexadecemial character or daash (-). '..' and '/'.
            .replace(/[^0-9a-fA-F-]+/g, "")

        File.get(sanitisedItemID)
            .then(
                file => {
                    // This will figure out the file extension from the filetype.
                    // A filetype (MIME type) is in this format: "category/filetype".
                    // This selectes `filetype`. It also ignores any "type+type"...
                    // Examples:
                    // image/png     --> "png"
                    // image/svg+xml --> "svg"
                    const fileExtension  = file.type.match(/(?<=^\w+\/)\w+(?=(\+\S*)?$)/gm)[0]

                    //Check if the file exists. If it doesn't, send an error.
                    if (!existsSync(`./data/files/${sanitisedItemID}.${fileExtension}`))
                        return res.failit(HusmusenError(404, "ERR_FILE_NOT_FOUND", "That file does not exist."))

                    // Send back the file.
                    res.sendFile(path.join(`${path.resolve()}/data/files/${file.fileID}.${fileExtension}`))
                }
            )
            .catch(
                err => {
                    res.failit(HusmusenError(404, "ERR_FILE_NOT_FOUND", "It appears this file does not exist."))
                    log.error("It appears this file does not exist...")
                    console.error(err)
                }
            )

    }
)
fileApi.get(
    "/info/:id",
    (req, res) => File.get(req.params.id)
        .then(
            file => {
                if (!file)
                    return res.failit(HusmusenError(404, "ERR_FILE_NOT_FOUND", "That file doesn't exist in the database."))

                res.sendit(file)
            }
        )
        .catch(
            err => {
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error getting the information from the database."))
                log.error("There was an error reading information about a file in the database...")
                console.error(err)
            }
        )
)

fileApi.post(
    "/new",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const {
            name,
            description,
            type,
            license,
            relatedItem,
            fileDataURL
        } = req.data

        // This will figure out the file extension from the filetype.
        // A filetype (MIME type) is in this format: "category/filetype".
        // This selectes `filetype`. It also ignores any "type+type"...
        // Examples:
        // image/png     --> "png"
        // image/svg+xml --> "svg"
        const fileExtension  = type.match(/(?<=^\w+\/)\w+(?=(\+\S*)?$)/gm)[0]
        // This will select all the data in the dataurl
        const fileData       = fileDataURL.split(",")[1]
        const fileDataBuffer = Buffer.from(fileData, "base64")

        File.create(name, description, type, license, relatedItem)
            .then(
                async file => {
                    writeFile(`./data/files/${file.fileID}.${fileExtension}`, fileDataBuffer)
                        .then(
                            () => {
                                File.save(file)
                                    .then(
                                        () => {
                                            res.sendit(file)
                                            log.write(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' created file with ID '${file.fileID}'.`)
                                        }
                                    )
                                    .catch(
                                        err => {
                                            res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error saving the information to the database."))
                                            log.error("There was an error saving information about a file to the database...")
                                            console.error(err)
                                        }
                                    )
                            }
                        )
                        .catch(
                            err => {
                                res.failit(HusmusenError(500, "ERR_FILESYSTEM_ERROR", "There was an error saving the file to disk."))
                                log.error("There was an error saving the file to disk...")
                                console.error(err)
                            }
                        )
                }
            )
            .catch(
                err => {
                    res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error creating the file information."))
                    log.error("There was an error creating the file information...")
                    console.error(err)
                }
            )
    }
)
fileApi.post(
    "/edit",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const originalFileID = req.data.fileID
        const {
            name,
            license,
            relatedItem
        } = req.data.newFileData

        File.update(originalFileID, name, license, relatedItem)
            .then(
                file => {
                    res.sendit(file)
                    log.write(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' edited file with ID '${file.fileID}'.`)
                }
            )
            .catch(
                err => {
                    res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error updating the file information."))
                    log.error("There was an error updating the file information...")
                    console.error(err)
                }
            )
    }
)
fileApi.post(
    "/delete",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const fileID = req.data.fileID

        File.get(fileID)
            .then(
                fileInDatabase => {
                    if (!fileInDatabase)
                        return res.failit(HusmusenError(404, "ERR_FILE_NOT_FOUND", "That file does not exist!"))

                    const fileExtension = fileInDatabase.type.replace(/^\w+\//g, "")
                    rm(`./data/files/${fileID}.${fileExtension}`)
                        .then(() => File.delete(fileID))
                        .then(
                            () => {
                                res.sendit(fileInDatabase)
                                log.write(`Admin '${req.auth.username}' deleted file with ID '${fileID}'.`)
                            }
                        )
                        .catch(
                            err => {
                                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an deleting the file..."))
                                log.error("Encountered an error while deleting the file!")
                                console.error(err)
                            }
                        )
                }
            )
            .catch(
                err => {
                    res.failit(HusmusenError(500, "ERR_FILE_NOT_FOUND", "There was an deleting the file..."))
                    log.error("Encountered an error while deleting the file!")
                    console.error(err)
                }
            )
    }
)

export default fileApi