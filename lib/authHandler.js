import { request, response } from "express"
import jwt from "jsonwebtoken"

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
     * This makes the input data available on `req.data` and the response formatter available on `res.sendit`
     * @param {request}  req
     * @param {response} res
     * @param {Function} next
     */

    function handler(req, res, next) {
        const token = req.header("Husmusen-Access-Token")

        if (!token)
            return res.status(401).send("You need to provide your access token in the header 'Husmusen-Access-Token'!")

        const verifiedToken = jwt.verify(token, process.env.TOKEN_SECRET ?? "SUPER SECRET")

        if (!verifiedToken)
            return res.status(401).send("It seems as if your access token is invalid!")

        if (options.requiresAdmin && !verifiedToken.isAdmin)
            return res.status(401).send("You need to be an admin to see this!")


        req.auth = verifiedToken
        next()
    }

    return handler
}