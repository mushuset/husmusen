import api from "./api/api.js"
import express from "express"
import getLogger from "./lib/log.js"
import rateLimit from "express-rate-limit"
import requestHandler from "./lib/requestHandler.js"
import setupGraphicalApp from "./lib/graphicalApp.js"
import { config as getDotenvOptions } from "dotenv"
import { startDB } from "./lib/database.js"

// Get variables from the .env file
getDotenvOptions()
const PORT       = process.env.PORT    || 12345
const DB_HOST    = process.env.DB_HOST || "127.0.0.1"
const DB_PORT    = process.env.DB_PORT || "3306"
const DB_USER    = process.env.DB_USER || "user"
const DB_PASS    = process.env.DB_PASS || "password"
const DB_NAME    = process.env.DB_NAME || "husmusen"

const log = getLogger("MAIN     |", "blue")

log.write("Starting up Husmusen...")
const husmusen = express()

log.write("Setting up the database connection...")
await startDB(DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME)

const apiRateLimiter = rateLimit({
    windowMs: 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
})

log.write("Starting up the API...")
husmusen.use(requestHandler)
husmusen.use("/api", apiRateLimiter, api)

log.write("Starting up the GUI control panel...")
setupGraphicalApp(husmusen)

husmusen.listen(PORT, () => log.write("Husmusen started and listening on port:", PORT))