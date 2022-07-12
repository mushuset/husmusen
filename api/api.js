import { Router } from "express"
import getDBInfo from "../lib/DBInfo.js"
import api_1_0_0 from "./1.0.0/1.0.0.js"

const api = Router()

api.use("/1.0.0", api_1_0_0)
api.get(
    "/db_info",
    (req, res) => getDBInfo()
        .then(DBInfo => res.sendit(DBInfo))
        .catch(err => res.status(500).send(err))
)

// TODO: These should maybe be read from a file as well?
api.get(
    "/db_info/version",
    (req, res) => getDBInfo()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersion))
        .catch(err => res.status(500).send(err))
)
api.get(
    "/db_info/versions",
    (req, res) => getDBInfo()
        .then(DBInfo => res.header("Content-Type", "text/plain").send(DBInfo.protocolVersions.join(",")))
        .catch(err => res.status(500).send(err))
)

export default api