import { Router } from "express"
import getLogger from "../../lib/log.js"
import Item from "../../models/Item.js"
import authHandler from "../../lib/authHandler.js"
import { queryDB } from "../../lib/database.js"
import colors from "colors"
import { ItemTypes } from "../../models/Item.js"
import Keyword from "../../models/Keyword.js"

const itemApi = Router()
const log = getLogger("Database |", "magenta")

const VALID_SORT_FIELDS = ["name", "relevance", "lastUpdated", "addedAt", "itemID"]

// TODO: Implement freetext/fulltext search!
itemApi.get(
    "/search",
    async (req, res) => {
        // Get all input queries...
        const TYPES        = req.query.types        ?? ""
        const FREETEXT     = req.query.freetext     ?? ""
        const KEYWORDS     = req.query.keywords     ?? ""
        const KEYWORD_MODE = req.query.keyword_mode ?? ""
        const SORT         = req.query.sort         ?? ""
        const REVERSE      = req.query.reverse      ?? ""

        // Make sure the requested types are valid. If there are no valid types in the request, send back an error.
        const validTypes = TYPES !== "" ? TYPES.split(",").filter(type => ItemTypes.includes(type)) : ItemTypes
        if (!validTypes[0])
            return res.status(400).send("No valid types entered!")

        // Make sure the requested keywords are valid.
        const allKeywords      = await Keyword.get(validTypes)
        const validKeywords    = KEYWORDS
            .split(",")
            .filter(keyword => allKeywords.includes(keyword))
            // Sort them in alphabetical order... (More on this later...)
            .sort((a, b) => a.localeCompare(b))

        // FIXME: It might be possible to do these search via FULLTEXT indexes using `IN BOOLEAN MODE`...
        // UPDATE: I think that would be "as effective"...
        const keywordMode      = KEYWORD_MODE.toUpperCase() === "AND" ? "AND" : "OR"
        const keywordSearchSQL = keywordMode === "AND"
            // If in "AND-mode", use this magic RegEx created here:
            // This also requires the keywords to be sorted alphabetically.
            ? (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("(.*,|)")})(?=,|$)'` : "")
            // Otherwise, use "OR-mode" with this magic RegEx:
            : (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("|")})(?=,|$)'` : "")

        // Make sure the requested sort field is valid, or fall back to `name`.
        const sortSearchSQL    = `${VALID_SORT_FIELDS.includes(SORT) ? SORT : "name"}`
        // Since the expected order of `relevance` is descending, while all others are ascending,
        // this has to be used to make sure reverse (and not reverse) sorts the result in the
        // correct order... Basically:
        // If sort by relevance AND reverse is on      --> Ascending
        // If sort by relevance AND reverse is off     --> Descending
        // If sort by not relevance AND reverse is on  --> Descending
        // If sort by not relevance AND reverse is off --> Ascending
        const reverseSearchSQL  = sortSearchSQL === "relevance"
            ? REVERSE === "1" || REVERSE === "on" || REVERSE === "true" ? "ASC"  : "DESC"
            : REVERSE === "1" || REVERSE === "on" || REVERSE === "true" ? "DESC" : "ASC"

        const magicRelevanceFormula   = "((MATCH(name) AGAINST(:freetext IN BOOLEAN MODE) + 1) * (MATCH(description) AGAINST(:freetext IN BOOLEAN MODE) + 1) - 1) / 3"
        const magicRelevanceSearchSQL = FREETEXT ? "AND (MATCH(name) AGAINST(:freetext IN BOOLEAN MODE) OR MATCH(description) AGAINST(:freetext IN BOOLEAN MODE))" : ""

        // Now use all information from above to construct a search query and then search.
        // If it succeeds, send back the result.
        // If it fails, send back an error.
        queryDB(
            {
                namedPlaceholders: true,
                sql:`
                    SELECT *, (${magicRelevanceFormula}) AS relevance FROM husmusen_items
                        WHERE type IN (:validTypes)
                        ${keywordSearchSQL}
                        ${magicRelevanceSearchSQL}
                        ORDER BY ${sortSearchSQL} ${reverseSearchSQL}
                `
            },
            {
                freetext: FREETEXT,
                validTypes
            }
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

// This gets a singular item by its ItemID.
itemApi.get(
    "/info/:id",
    (req, res) => {
        // This should in theory prevent reflected XSS.
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

// This creates a new Item. It can only be done by users and admins, not guests.
itemApi.post(
    "/new",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        // Get all the data in the request...
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
                    // When the Item is created, it must be saved.
                    Item.save(item)
                        .then(item => {
                            res.sendit(item)
                            log(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' created item with ID '${itemID}'.`)
                        })
                        // If errors are encountered, handle them:
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

// Let users and admins edit Items.
itemApi.post("/edit/:id", (req, res) => res.sendit("NOT IMPLEMENTED!"))

// Let users and admins mark Items as expired.
itemApi.post(
    "/mark/:id",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const itemID = req.params.id

        Item.get(itemID)
            .then(
                itemInDatabase => {
                    // Make sure the Item exists...
                    if (!itemInDatabase)
                        return res.status(400).send("That item doesn't exist!")

                    // Make sure a reason for the expirery is specified!
                    const reason = req.data.reason
                    if (!reason)
                        return res.status(400).send("You must specify a reason!")

                    // Mark the item as expirered, handle errors...
                    Item.mark(itemID, reason)
                        .then(
                            () => {
                                res.sendit(Object.assign(itemInDatabase, { isExpired: 1, expireReason: reason }))
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

// Let admins, and admins only, permanently delete Items.
itemApi.post(
    "/delete/:id",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        const itemID = req.params.id

        Item.get(itemID)
            .then(
                itemInDatabase => {
                    // Make sure the item exists
                    if (!itemInDatabase)
                        return res.status(400).send("That item doesn't exist!")

                    // Delete it and handle errors.
                    Item.delete(itemID)
                        .then(
                            () => {
                                res.sendit(itemInDatabase)
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