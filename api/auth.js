import argon2 from "argon2"
import colors from "colors"
import { Router } from "express"
import jwt from "jsonwebtoken"
import authHandler, { SECRET } from "../lib/authHandler.js"
import { queryDB } from "../lib/database.js"
import getLogger from "../lib/log.js"
import HusmusenError from "../models/Error.js"

const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000

const authApi = Router()
const log = getLogger("Auth     |", "red")

authApi.post(
    "/login",
    async (req, res) => {
        const { username, password } = req.data

        if (!username)
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER", "You must specify 'username'."))

        if (!password)
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER", "You must specify 'password'."))

        const user = await queryDB(
            "SELECT * FROM husmusen_users WHERE username = ?",
            [ username ],
            true
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error looking up the user!"))
            }
        )

        if (!user)
            return res.failit(HusmusenError(400, "ERR_USER_NOT_FOUND", "It seems as if that user doesn't exist."))

        const passMatches = await argon2.verify(user.password, password)
        if (!passMatches)
            return res.failit(HusmusenError(400, "ERR_INVALID_PASSWORD", "Incorrect password."))

        const token = jwt.sign(
            {
                username,
                isAdmin: user.isAdmin
            },
            SECRET,
            {
                expiresIn: "4h"
            }
        )

        res.sendit({
            token,
            validUntil: new Date(Date.now() + FOUR_HOURS_IN_MS)
        })

        log.write(`${user.isAdmin ? "Admin" : "User"} '${username}' logged in!`)
    }
)

authApi.post(
    "/who",
    authHandler({ requiresAdmin: false }),
    (req, res) => res.sendit(req.auth)
)

authApi.post(
    "/new",
    authHandler({ requiresAdmin: true }),
    async (req, res) => {
        const { username, password, isAdmin } = req.data

        if (!username)
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER", "You must define a username!"))

        if (!password)
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER", "You must define a password!"))

        if (!username.match(/^\w{0,32}$/))
            return res.failit(HusmusenError(400, "ERR_INVALID_PARAMETER", "Username can only be A-Z, a-z, 0-9, and underscore (_)! It must be no more than 32 characters!"))

        const userExists = await queryDB(
            "SELECT username FROM husmusen_users WHERE username = ?",
            [ username ],
            true
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an while looking up if the username is taken!"))
            }
        )

        if (userExists)
            return res.failit(HusmusenError(400, "ERR_ALREADY_EXISTS", "There was an while looking up if the username is taken!"))


        log.write(`Creating user '${username}'...`)

        const passwordHash = await argon2.hash(
            password,
            {
                memoryCost: 8092,
                hashLenght: 32,
                timeCost: 4,
                parallellism: 2,
            }
        )

        queryDB(
            "INSERT INTO husmusen_users (username, password, isAdmin) VALUES (?, ?, ?)",
            [ username, passwordHash, isAdmin ? 1 : 0 ]
        ).then(
            () => {
                log.write(`Admin '${req.auth.username}' created ${isAdmin ? "admin" : "user"} '${username}'!`)
                res.sendit({ username, password, isAdmin })
            }
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error saving the user!"))
            }
        )
    }
)

authApi.post(
    "/change_password",
    authHandler({ requiresAdmin: false }),
    async (req, res) => {
        const { currentPassword, newPassword } = req.data

        if (!currentPassword || !newPassword)
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETERS", "You need to specify both 'currentPassword' and 'newPassword'!"))

        const userSearch = await queryDB("SELECT * FROM husmusen_users WHERE username = ?", [ req.auth.username ], true)
            .catch(err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error looking up the user!"))
            })

        const passwordMatches = await argon2.verify(userSearch.password, currentPassword)
        if (!passwordMatches)
            return res.failit(HusmusenError(401, "ERR_INVALID_PASSWORD", "Your 'currentPassword' is incorrect!"))

        const newPasswordHAsh = await argon2.hash(
            newPassword,
            {
                memoryCost: 8092,
                hashLenght: 32,
                timeCost: 4,
                parallellism: 2,
            }
        )

        queryDB(
            "UPDATE husmusen_users SET password = ? WHERE username = ?",
            [ newPasswordHAsh, req.auth.username ]
        ).then(
            () => res.sendit({ username: req.auth.username, password: newPassword })
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error saving your new password!"))
            }
        )
    }
)

authApi.post(
    "/delete",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        const username = req.data.username

        if (!username)
            return res.failit(HusmusenError(400, "ERR_INVALID_PARAMETER", "You need to specify a `username`!"))

        if (username === req.auth.username)
            return res.failit(HusmusenError(402, "ERR_FORBIDDEN_ACTION","You cannot delete yourself!"))

        queryDB(
            "DELETE FROM husmusen_users WHERE username = ?",
            [ username ]
        ).then(
            () => {
                res.sendit({ username })
                log.write(`Admin '${username}' deleted the user '${username}'!`)
            }
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error deleting that user!"))
            }
        )
    })

// NOTE: This should only ever be active in DEVELOPMENT, NEVER IN PRODUCTION!
// This makes it so that you can easily create an initial admin, that can then manage users!
if (process.env.DEBUG === "true") {
    log.write(colors.yellow("WARNING!"), "Enabling debug creation of admin users on '/api/auth/debug_admin_creation'!")
    authApi.post(
        "/debug_admin_creation",
        async (req, res) =>{
            const { username, password } = req.data

            if (!username)
                return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER","You must define a username!"))

            if (!password)
                return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER","You must define a password!"))

            if (!username.match(/^\w{0,32}$/))
                return res.failit(HusmusenError(400, "ERR_INVALID_PARAMETER","Username can only be A-Z, a-z, 0-9, and underscore (_)! It must be no more than 32 characters!"))

            const userExists = await queryDB(
                "SELECT username FROM husmusen_users WHERE username = ?",
                [ username ],
                true
            )

            if (userExists)
                return res.failit(HusmusenError(400, "ERR_ALREADY_EXISTS", "That user already exists!"))

            log.write(`DEBUG: Creating user '${username}'...`)

            const passwordHash = await argon2.hash(
                password,
                {
                    memoryCost: 8092,
                    hashLenght: 32,
                    timeCost: 4,
                    parallellism: 2,
                }
            )

            queryDB(
                "INSERT INTO husmusen_users (username, password, isAdmin) VALUES (?, ?, 1)",
                [ username, passwordHash ]
            ).then(
                () => {
                    log.write("User created!")
                    res.sendit({ username, password, isAdmin: true })
                }
            ).catch(
                err => {
                    log.error("Encountered an error.")
                    console.error(err)
                    res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error saving the user!"))
                }
            )

            log.write(`Forced the creation of admin '${username}' via '/api/auth/debug_admin_creation'!`)
        }
    )
}

export default authApi