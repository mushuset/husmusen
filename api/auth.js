import { Router } from "express"
import getLogger from "../lib/log.js"
import argon2 from "argon2"
import { queryDB } from "../lib/database.js"
import colors from "colors"
import jwt from "jsonwebtoken"
import authHandler from "../lib/authHandler.js"
import { SECRET } from "../lib/authHandler.js"

const FOUR_HOURS_IN_MS = 4 * 60 * 60 * 1000

const authApi = Router()
const log = getLogger("Auth     |", "red")

authApi.post(
    "/login",
    async (req, res) => {
        const { username, password } = req.data

        if (!username)
            return res.status(400).send("You must specify the username!")

        if (!password)
            return res.status(400).send("You must specify the password!")

        const user = await queryDB(
            "SELECT * FROM husmusen_users WHERE username = ?",
            [ username ],
            true
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(500).send("There was an error looking up the user!")
            }
        )

        if (!user)
            return res.status(400).send("It seems as if that user doesn't exist.")

        const passMatches = await argon2.verify(user.password, password)
        if (!passMatches)
            return res.status(400).send("Incorrect password.")

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
            return res.status(400).send("You must define a username!")

        if (!password)
            return res.status(400).send("You must define a password!")

        if (isAdmin === undefined)
            return res.status(400).send("You must define 'isAdmin'!")

        if (!username.match(/^\w{0,32}$/))
            return res.status(400).send("Username can only be A-Z, a-z, 0-9, and underscore (_)! It must be no more than 32 characters!")

        const userExists = await queryDB(
            "SELECT username FROM husmusen_users WHERE username = ?",
            [ username ],
            true
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(500).send("There was an while looking up if the username is taken!")
            }
        )

        if (userExists)
            return res.status(400).send("That user already exists!")

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
                log.write("User created!")
                res.sendit({ username, password, isAdmin })
            }
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(500).send("There was an error saving the user!")
            }
        )

        log.write(`Admin '${req.auth.username}' created ${isAdmin ? "admin" : "user"} '${username}'!`)
    }
)

authApi.post(
    "/change_password",
    authHandler({ requiresAdmin: false }),
    async (req, res) => {
        const { currentPassword, newPassword } = req.data

        if (!currentPassword || !newPassword)
            return res.status(400).send("You need to specify both 'currentPassword' and 'newPassword'!")

        const userSearch = await queryDB("SELECT * FROM husmusen_users WHERE username = ?", [ req.auth.username ], true)
            .catch(err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(500).send("There was an error looking up the user!")
            })

        const passwordMatches = await argon2.verify(userSearch.password, currentPassword)
        if (!passwordMatches)
            return res.status(401).send("Your 'currentPassword' is incorrect!")

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
                res.status(500).send("There was an error saving your new password!")
            }
        )
    }
)

authApi.post(
    "/delete/:username",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        if (req.params.username === req.auth.username)
            return res.send(402).send("You cannot delete yourself!")

        queryDB(
            "DELETE FROM husmusen_users WHERE username = ?",
            [ req.params.username ]
        ).then(
            () => {
                res.sendit({ username: req.params.username })
            log.write(`Admin '${req.auth.username}' deleted the user '${req.params.username}'!`)
            }
        ).catch(
            err => {
                log.error("Encountered an error.")
                console.error(err)
                res.status(500).send("There was an error deleting that user!")
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
                return res.status(400).send("You must define a username!")

            if (!password)
                return res.status(400).send("You must define a password!")

            if (!username.match(/^\w{0,32}$/))
                return res.status(400).send("Username can only be A-Z, a-z, 0-9, and underscore (_)! It must be no more than 32 characters!")

            const userExists = await queryDB(
                "SELECT username FROM husmusen_users WHERE username = ?",
                [ username ],
                true
            )

            if (userExists)
                return res.status(400).send("That user already exists!")

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
                    res.status(500).send("There was an error saving the user!")
                }
            )

            log.write(`Forced the creation of admin '${username}' via '/api/auth/debug_admin_creation'!`)
        }
    )
}

export default authApi