import { Router } from "express"
import authHandler from "../lib/authHandler.js"
import DBInfo from "../models/DBInfo.js"

// TODO: Fix error handling here.

const dbInfoApi = Router()

// Get all DBInfo
dbInfoApi.get(
    "/",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.sendit(DBInfo))
        .catch(err => res.status(500).send(err))
)

// Get only the latest supported version.
dbInfoApi.get(
    "/version",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersion))
        .catch(err => res.status(500).send(err))
)

// Get all supported versions...
// All supported versions should be accesible under /api/<VERSION>/...
dbInfoApi.get(
    "/versions",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersions.join(",")))
        .catch(err => res.status(500).send(err))
)

// Let admins edit the DBInfo
// TODO: Should verify the input.
dbInfoApi.post(
    "/",
    authHandler({ requiresAdmin: true }),
    (req, res) => DBInfo.save(req.data)
        .then(async () => res.sendit(await DBInfo.get()))
        .catch(err => res.status(500).send(err))
)

export default dbInfoApi