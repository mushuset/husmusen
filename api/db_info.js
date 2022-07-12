import { Router } from "express"
import getDBInfo from "../lib/DBInfo.js"

const dbInfoApi = Router()

dbInfoApi.get(
    "/",
    (req, res) => getDBInfo()
        .then(DBInfo => res.sendit(DBInfo))
        .catch(err => res.status(500).send(err))
)

dbInfoApi.get(
    "/version",
    (req, res) => getDBInfo()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersion))
        .catch(err => res.status(500).send(err))
)

dbInfoApi.get(
    "/versions",
    (req, res) => getDBInfo()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersions.join(",")))
        .catch(err => res.status(500).send(err))
)

export default dbInfoApi