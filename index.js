import express from "express"
import { config as getDotenvOptions } from "dotenv"
import getLogger from "./lib/log.js"

getDotenvOptions()
const PORT   = process.env.PORT   || 12345
const DB_URI = process.env.DB_URI || "sqlite::memory:"


const log = getLogger("MAIN", "blue")
const husmusen = express()

husmusen.get("/", (req, res) => res.send("Hello World!"))

husmusen.listen(PORT, () => log("Listening on port: " + PORT))

