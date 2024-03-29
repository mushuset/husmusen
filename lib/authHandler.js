import crypto from "crypto"
import { config as getDotEnvOptions } from "dotenv"
import jwt from "jsonwebtoken"
import getLogger from "./log.js"

const log = getLogger("Auth     |", "red")

/**
 * This generates a secure secret (I hope it isn't predictable).
 * @returns {string}
 */
function generateTokenSecret() {
    const now      = Date.now()
    const randNum  = crypto.randomInt(1_000_000_000, 10_000_000_000)
    const randUUID = crypto.randomUUID()
    const randData = `${now}${randNum}${randUUID}`

    const secureSecret = crypto.createHash("sha512").update(randData).digest("hex")
    return secureSecret
}

getDotEnvOptions()
export const SECRET = process.env.TOKEN_SECRET ?? generateTokenSecret()
console.log(SECRET)

/**
 * @typedef  {object}  AuthHandlerOptions
 * @property {boolean} requiresAdmin Whether or not the user has to be admin.
 */

/**
 * This makes sure a path requires authentication to reach.
 * @param {AuthHandlerOptions} options Options.
 */
export default function authHandler(options) {
    /**
     * This makes sure the user is authenticated and makes the authentication information available on `req.auth`.
     * @param {request}  req
     * @param {response} res
     * @param {Function} next
     */
    function handler(req, res, next) {
        const token = req.header("Husmusen-Access-Token")

        if (!token)
            return res.status(401).send("You need to provide your access token in the header 'Husmusen-Access-Token'!")

        // TODO: Make sure this generates a safe fallback key instead of falling back on "SUPER SECRET".
        const verifiedToken = jwt.verify(token, process.env.TOKEN_SECRET ?? "SUPER SECRET")

        if (!verifiedToken)
            return res.status(401).send("It seems as if your access token is invalid!")

        if (options.requiresAdmin && !verifiedToken.isAdmin)
            return res.status(401).send("You need to be an admin to do this!")


        req.auth = verifiedToken

        log.write(`${verifiedToken.isAdmin ? "Admin" : "User"} accessed path '${req.originalUrl}'!`)

        next()
    }

    return handler
}

// FOOTNOTE: All functionality in this file should be somewhat self explanatory.
//           If not, feel free to open an issue with any questions.