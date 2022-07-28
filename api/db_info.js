import { Router } from "express"
import authHandler from "../lib/authHandler.js"
import DBInfo from "../models/DBInfo.js"

// TODO: Fix error handling here.

const dbInfoApi = Router()

dbInfoApi.get(
    "/",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.sendit(DBInfo))
        .catch(err => res.status(500).send(err))
)

dbInfoApi.get(
    "/version",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersion))
        .catch(err => res.status(500).send(err))
)

dbInfoApi.get(
    "/versions",
    (req, res) => DBInfo.get()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersions.join(",")))
        .catch(err => res.status(500).send(err))
)

// TODO: Should verify the input.
dbInfoApi.post(
    "/",
    authHandler({ requiresAdmin: true }),
    (req, res) => DBInfo.save(req.data)
        .then(async () => res.sendit(await DBInfo.get()))
        .catch(err => res.status(500).send(err))
)

export default dbInfoApi