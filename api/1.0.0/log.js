import { Router } from "express"
import authHandler from "../../lib/authHandler.js"
import fs from "fs/promises"
import getLogger from "../../lib/log.js"

const logApi = Router()
const log    = getLogger("Log      |", "cyan")

logApi.get(
    "/get",
    authHandler({ requiresAdmin: true }),
    async (req, res) => {
        const fileData     = await fs.readFile("./data/husmusen.log")
        const logData      = fileData.toString()
        const logLines     = logData.split(/\n+/)
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
        
        res.sendit(req.query.reverse === "on" ? formattedLog.reverse() : formattedLog)
        log(`Admin '${req.auth.username}' accessed the log!`)
    }
)

export default logApi