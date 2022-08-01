import { Router } from "express"
import authHandler from "../../lib/authHandler.js"
import fs from "fs/promises"
import getLogger from "../../lib/log.js"

const logApi = Router()
const log    = getLogger("Log      |", "cyan")

// Allows admins to get the log...
logApi.get(
    "/get",
    authHandler({ requiresAdmin: true }),
    async (req, res) => {
        // Write who is accessing the log to the log...
        log.write(`Admin '${req.auth.username}' accessed the log!`)

        // Get the file data, and make an array of each line...
        const fileData     = await fs.readFile("./data/husmusen.log")
        const logData      = fileData.toString()
        const logLines     = logData.split(/\n+/)

        // Format the lines and turn the lines into object looking like this:
        // { prefix, timestamp, message }
        const formattedLog = logLines
            .filter(line => line !== "")
            .map(line => {
                const segments = line.split(";")
                const [ prefix, timestamp, ...message ] = segments
                return {
                    prefix,
                    timestamp,
                    message: message.join(";")
                }
            })

        // Send back the log. If using `?reverse=on` in the URL allow the log to be reversed.
        res.sendit(req.query.reverse === "on" || req.query.reverse === "true" || req.query.reverse === "1" ? formattedLog.reverse() : formattedLog)
    }
)

export default logApi