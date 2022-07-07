import { Router } from "express"
import api_1_0_0 from "./1.0.0/api.js"

const api = Router()

api.use("/1.0.0", api_1_0_0)
api.get("/db_info", (req, res) => res.json({
    "protocolVersion": "1.0.0",
    "protocolVersions": [ "1.0.0", "0.8.0" ],
    "supportedInputFormats": [ "YAML", "JSON" ],
    "supportedOutputFormats": [ "YAML", "JSON" ],
    "instanceName": "Husmusen på Museum",
    "museumDetails": {
      "name": "Museum",
      "description": "Ett helt vanligt museum.",
      "address": "Gatanvägen 4",
      "location": "Kungshamn",
      "coordinates": "0°0′0″ N, 25°0′0″ W",
      "website": "https://example.com"
    }
}))
api.get("/db_info/version", (req, res) => res.send("1.0.0"))
api.get("/db_info/versions", (req, res) => res.send("1.0.0"))

export default api