import { Router } from "express"
import getLogger from "../../lib/log.js"
import Item from "../../models/Item.js"
import authHandler from "../../lib/authHandler.js"
import { queryDB } from "../../lib/database.js"
import colors from "colors"

const itemApi = Router()
const log = getLogger("Database |", "magenta")

itemApi.get(
    "/search",
    (req, res) => {
        const TYPES    = req.query.types    ?? ""
        const FREETEXT = req.query.freetext ?? ""
        const KEYWORDS = req.query.keywords ?? ""
        const SORT     = req.query.sort     ?? "alphabetical"
        const REVERSE  = req.query.reverser ?? ""

        const typeSearchSQL = TYPES !== ""
            ? TYPES.split(",").map(type => `type LIKE '%${type}%'`).join(" OR ")
            : ""

        console.log(typeSearchSQL)

        queryDB(`
            SELECT * FROM husmusen_items ${typeSearchSQL !== "" ? `WHERE ${typeSearchSQL}` : ""}
        `).then(
            result => res.sendit(result)
        ).catch(
            err => {
                res.status(500).send("Encountered an error while searching the database!")
                log(colors.red("ERROR!"), "Encountered an error while searching the database!")
                console.error(err)
            }
        )
    }
)

itemApi.get(
    "/info/:id",
    (req, res) => {
        const rawItemID         = req.params.id
        const fixedLengthItemID = rawItemID.length < 16 ? rawItemID : rawItemID.substring(0, 16)
        const sanitisedItemID   = fixedLengthItemID.replace(/<script[\S\s]*>[\S\s]*$/g, "")

        Item.get(sanitisedItemID)
            .then(item => res.sendit(item))
            .catch(err => {
                if (err === "NO_EXISTS")
                    return res.status(404).send(`There exists no item with ItemID '${sanitisedItemID}'!`)

                res.status(500).send(`There was an error while getting item with ItemID '${sanitisedItemID}'!`)
                console.error(err)
            })
    }
)

itemApi.get("/keywords", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/keywords/:type", (req, res) => res.sendit(req.originalUrl))

itemApi.post(
    "/new",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const {
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        } = req.data

        const itemRequest = Item.create(
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        )

        if (itemRequest.status === "ERR")
            return res.status(500).send(itemRequest.data)

        const item = itemRequest.data

        Item.save(item)
            .then(item => res.sendit(item))
            .catch(err => {
                if (err.code === "ER_DUP_ENTRY")
                    return res.status(500).send(`The itemID '${itemID}' is already taken!`)
                res.status(500).send("Error while saving the item!")
                console.error(err)
            })

        log(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' created item with ID '${itemID}'.`)
    }
)

itemApi.post("/edit/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/mark/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/delete/:id", (req, res) => res.sendit(req.originalUrl))

export default itemApi