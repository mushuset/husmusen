import express from "express"
import { config as getDotenvOptions } from "dotenv"
import getLogger from "./lib/log.js"
import { startDB } from "./lib/database.js"
import api from "./api/api.js"
import requestHandler from "./lib/requestHandler.js"
import njk from "nunjucks"
import url2njk from "./lib/url2njk.js"

getDotenvOptions()
const PORT       = process.env.PORT    || 12345
const DB_HOST    = process.env.DB_HOST || "127.0.0.1"
const DB_PORT    = process.env.DB_PORT || "3306"
const DB_USER    = process.env.DB_USER || "user"
const DB_PASS    = process.env.DB_PASS || "password"
const DB_NAME    = process.env.DB_NAME || "husmusen"

const log = getLogger("MAIN     |", "blue")
const husmusen = express()
log("Starting up Husmusen...")

await startDB(DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)

husmusen.use(requestHandler)
njk.configure(
    "app",
    {
        autoescape: true,
        express: husmusen,
        lstripBlocks: true,
        trimBlocks: true,
    }
)

husmusen.use("/api",   api)
husmusen.get('/app',   url2njk)
husmusen.get('/app/*', url2njk)

husmusen.get("/", (req, res) => res.redirect("/app"))
husmusen.listen(PORT, () => log("Husmusen started and listening on port:", PORT))