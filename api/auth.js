import { Router } from "express"
import getLogger from "../lib/log.js"
import argon2 from "argon2"
import { DBPool } from "../lib/database.js"
import colors from "colors"
import jwt from "jsonwebtoken"

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

        const con  = await DBPool.getConnection()
        const userSearch = await con.query("SELECT * FROM husmusen_users WHERE username = ?", [ username ])
            .catch(err => {
                log(colors.red("ERROR!", "Encountered an error."))
                console.error(err)
                res.status(500).send("There was an error looking up the user!")
            })

        delete userSearch.meta
        const user = userSearch[0]

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
            "SUPER SECRET", // TODO: SHOULD BE CHANGED
            {
                expiresIn: "4h"
            }
        )

        res.sendit({
            token,
            validUntil: new Date(Date.now() + FOUR_HOURS_IN_MS)
        })
    }
)

authApi.post("/new", (req, res) => res.send("UNIMPLEMENTED!"))
authApi.post("/change_pass", (req, res) => res.send("UNIMPLEMENTED!"))
authApi.post("/delete/:user", (req, res) => res.send("UNIMPLEMENTED!"))

// NOTE: This should only ever be active in DEVELOPMENT, NEVER in PRODUCTION!
// This makes it so that you can easily create an initial admin, that can then manage users!
if (process.env.DEBUG === "true")
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

            const con = await DBPool.getConnection()
            const userExists = await con.query("SELECT username FROM husmusen_users WHERE username = ?", [username])
            delete userExists.meta

            if (userExists[0])
                return res.status(400).send("That user already exists!")

            log(`Creating user '${username}'...`)

            const passwordHash = await argon2.hash(
                password,
                {
                    memoryCost: 8092,
                    hashLenght: 32,
                    timeCost: 4,
                    parallellism: 2,
                }
            )

            con.query(
                "INSERT INTO husmusen_users (username, password, isAdmin) VALUES (?, ?, 1)",
                [ username, passwordHash ]
            ).then(
                () => {
                    log("User created!")
                    res.sendit({ username, password, isAdmin: true })
                }
            ).catch(
                err => {
                    log(colors.red("ERROR!", "Encountered an error."))
                    console.error(err)
                    res.status(500).send("There was an error saving the user!")
                }
            ).finally(
                () => con.end()
            )
        }
    )

export default authApi