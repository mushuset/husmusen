import { Router } from "express"
import fs from "fs/promises"
import api_1_0_0 from "./1.0.0/api.js"

const api = Router()

api.use("/1.0.0", api_1_0_0)
api.get("/db_info", (req, res) => {
    fs.readFile("./config/db_info.json")
        .then(file   => file.toString())
        .then(dbInfo => res.sendit(dbInfo))
        .catch(err   => res.status(500).send(err))
})

// TODO: These should maybe be read from a file as well?
api.get("/db_info/version",  (req, res) => res.contentType("text/plain").send("1.0.0"))
api.get("/db_info/versions", (req, res) => res.contentType("text/plain").send("1.0.0"))

export default api