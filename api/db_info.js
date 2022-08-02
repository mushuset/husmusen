import { Router } from "express"
import authHandler from "../lib/authHandler.js"
import getLogger from "../lib/log.js"
import DBInfo from "../models/DBInfo.js"
import HusmusenError from "../models/Error.js"

// TODO: Fix error handling here.

const dbInfoApi = Router()
const log = getLogger("DBInfo   |", "green")

// Get all DBInfo
dbInfoApi.get(
    "/",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.sendit(DBInfo))
        .catch(
            err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error while reading `DBInfo`..."))
                log.write("Encountered an error while reading DBInfo!")
                console.error(err)
            }
        )
)

// Get only the latest supported version.
dbInfoApi.get(
    "/version",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersion))
        .catch(
            err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error while reading `DBInfo`..."))
                log.write("Encountered an error while reading DBInfo!")
                console.error(err)
            }
        )
)

// Get all supported versions...
// All supported versions should be accesible under /api/<VERSION>/...
dbInfoApi.get(
    "/versions",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersions.join(",")))
        .catch(
            err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error while reading `DBInfo`..."))
                log.write("Encountered an error while reading DBInfo!")
                console.error(err)
            }
        )
)

// Let admins edit the DBInfo
// TODO: Should verify the input.
dbInfoApi.post(
    "/",
    authHandler({ requiresAdmin: true }),
    (req, res) => DBInfo.save(req.data)
        .then(async () => res.sendit(await DBInfo.get()))
        .catch(
            err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error while reading `DBInfo`..."))
                log.write("Encountered an error while reading DBInfo!")
                console.error(err)
            }
        )
)

export default dbInfoApi