import { Router } from "express"
import getLogger from "../../lib/log.js"
import Item from "../../models/Item.js"
import authHandler from "../../lib/authHandler.js"
import { queryDB } from "../../lib/database.js"
import colors from "colors"
import { ItemTypes } from "../../models/Item.js"
import getKeywords from "../../lib/keywords.js"

const itemApi = Router()
const log = getLogger("Database |", "magenta")

const VALID_SORT_FIELDS = ["name", "relevance", "lastUpdated", "addedAt", "itemID"]

// TODO: Implement freetext/fulltext search!
itemApi.get(
    "/search",
    async (req, res) => {
        const TYPES    = req.query.types    ?? ""
        const FREETEXT = req.query.freetext ?? ""
        const KEYWORDS = req.query.keywords ?? ""
        const SORT     = req.query.sort     ?? "name"
        const REVERSE  = req.query.reverse  ?? ""

        const validTypes = TYPES !== "" ? TYPES.split(",").filter(type => ItemTypes.includes(type)) : ItemTypes
        if (!validTypes[0])
            return res.status(400).send("No valid types entered!")

        const allKeywords      = await getKeywords(validTypes)
        const validKeywords    = KEYWORDS.split(",").filter(keyword => allKeywords.includes(keyword))
        const keywordSearchSQL = validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("|")})(?=,|$)'` : ""

        const sortSearchSQL    = `${VALID_SORT_FIELDS.includes(SORT) ? SORT : "name"}`
        const reverseSearchSQL = REVERSE === "1" || REVERSE === "on" || REVERSE === "true" ? "DESC" : "ASC"

        queryDB(
            `
                SELECT * FROM husmusen_items
                    WHERE type IN (?)
                    ${keywordSearchSQL}
                    ORDER BY ${sortSearchSQL} ${reverseSearchSQL}
            `,
            [
                validTypes
            ]
        ).then(
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
        const fixedLengthItemID = rawItemID.length > 16 ? rawItemID : rawItemID.substring(0, 16)
        const sanitisedItemID   = fixedLengthItemID.replace(/[<>]+/g, "").replace(/script/gi, "")

        Item.get(sanitisedItemID)
            .then(item => res.sendit(item))
            .catch(err => {
                if (err === "NO_EXISTS")
                    return res.status(404).send(`There exists no item with ItemID '${sanitisedItemID}'!`)

                res.status(500).send(`There was an error while getting item with ItemID '${sanitisedItemID}'!`)
                log(colors.red("ERROR!"), "Encountered an error while searching the database!")
                console.error(err)
            })
    }
)

itemApi.get(
    "/keywords",
    (req, res) => {
        getKeywords()
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.status(500).send("There was an error getting the keywords...")
                log(colors.red("ERROR!"), "Encountered an error while searching the database!")
                console.error(err)
            })
    }
)

itemApi.get(
    "/keywords/:type",
    (req, res) => {
        const type = req.params.type

        if (!ItemTypes.includes(type))
            return res.status(400).send("Your type isn't valid! Please use one of the following: " + ItemTypes.join(", "))

        getKeywords([type])
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.status(500).send("There was an error getting the keywords...")
                log(colors.red("ERROR!"), "Encountered an error while searching the database!")
                console.error(err)
            })
    }
)

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