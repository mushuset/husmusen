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
        const TYPES        = req.query.types        ?? ""
        const FREETEXT     = req.query.freetext     ?? ""
        const KEYWORDS     = req.query.keywords     ?? ""
        const KEYWORD_MODE = req.query.keyword_mode ?? ""
        const SORT         = req.query.sort         ?? ""
        const REVERSE      = req.query.reverse      ?? ""

        const validTypes = TYPES !== "" ? TYPES.split(",").filter(type => ItemTypes.includes(type)) : ItemTypes
        if (!validTypes[0])
            return res.status(400).send("No valid types entered!")

        const allKeywords      = await getKeywords(validTypes)
        const validKeywords    = KEYWORDS
            .split(",")
            .filter(keyword => allKeywords.includes(keyword))
            .sort((a, b) => a.localeCompare(b))

        const keywordMode      = KEYWORD_MODE.toUpperCase() === "AND" ? "AND" : "OR"
        const keywordSearchSQL = keywordMode === "AND"
            ? (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("(.*,|)")})(?=,|$)'` : "")
            : (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("|")})(?=,|$)'` : "")

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
                log(colors.red("ERROR!"), "Encountered an error while getting the item!")
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

        Item.create(
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        )
            .then(
                item =>
                    Item.save(item)
                        .then(item => {
                            res.sendit(item)
                            log(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' created item with ID '${itemID}'.`)
                        })
                        .catch(err => {
                            if (err.code === "ER_DUP_ENTRY")
                                return res.status(500).send(`The itemID '${itemID}' is already taken!`)

                            res.status(500).send("Error while saving the item!")
                            log(colors.red("ERROR!"), "There was an error saving an item...")
                            console.error(err)
                        })
            )
            .catch(
                err => {
                    res.status(500).send(err)
                    log(colors.red("ERROR!"), "There was an error creating an item...")
                    console.error(err)
                }
            )
    }
)

itemApi.post("/edit/:id", (req, res) => res.sendit(req.originalUrl))

itemApi.post(
    "/mark/:id",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const itemID = req.params.id

        Item.get(itemID)
            .then(
                itemExists => {
                    if (!itemExists)
                        return res.status(400).send("That item doesn't exist!")

                    const reason = req.data.reason
                    if (!reason)
                        return res.status(400).send("You must specify a reason!")

                    Item.mark(itemID, reason)
                        .then(
                            () => {
                                res.sendit(Object.assign(itemExists, { isExpired: 1, expireReason: reason }))
                                log(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' marked item with ID '${itemID}'. Reason: ${reason}`)
                            })
                        .catch(
                            err => {
                                res.status(500).send("There was an marking the item...")
                                log(colors.red("ERROR!"), "Encountered an error while marking the item!")
                                console.error(err)
                            }
                        )
                }
            )
            .catch(
                err => {
                    res.status(500).send("There was an marking the item...")
                    log(colors.red("ERROR!"), "Encountered an error while marking the item!")
                    console.error(err)
                }
            )
    }
)

itemApi.post(
    "/delete/:id",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        const itemID = req.params.id

        Item.get(itemID)
            .then(
                itemExists => {
                    if (!itemExists)
                        return res.status(400).send("That item doesn't exist!")

                    Item.delete(itemID)
                        .then(
                            () => {
                                res.sendit(itemExists)
                                log(`Admin '${req.auth.username}' deleted item with ID '${itemID}'.`)
                            }
                        )
                        .catch(
                            err => {
                                res.status(500).send("There was an marking the item...")
                                log(colors.red("ERROR!"), "Encountered an error while marking the item!")
                                console.error(err)
                            }
                        )
                }

            )
            .catch(
                err => {
                    res.status(500).send("There was an deleting the item...")
                    log(colors.red("ERROR!"), "Encountered an error while deleting the item!")
                    console.error(err)
                }
            )
    }
)

export default itemApi