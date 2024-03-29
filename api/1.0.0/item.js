import { Router } from "express"
import authHandler from "../../lib/authHandler.js"
import { queryDB } from "../../lib/database.js"
import getLogger from "../../lib/log.js"
import HusmusenError from "../../models/Error.js"
import Item, { ItemTypes } from "../../models/Item.js"
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

        // If, for some reason, multiple `types=TYPE` are passed, make sure to combine all into one single array of types.
        const arrayifiedTypes = TYPES instanceof Array
            ? TYPES.flatMap(e => e.split(","))
            : TYPES.split(",")
        // Make sure the requested types are valid. If there are no valid types in the request, send back an error.
        const validTypes = arrayifiedTypes[0] ? arrayifiedTypes.filter(type => ItemTypes.includes(type)) : ItemTypes
        if (!validTypes[0])
            return res.failit(HusmusenError(400, "ERR_INVALID_PARAMETER", "No valid types entered!"))

        // If, for some reason, multiple `keywords=KEYWORD` are passed, make sure to combine all into one single array of keywords.
        const arrayifiedKeywords = KEYWORDS instanceof Array
            ? KEYWORDS.flatMap(e => e.split(","))
            : KEYWORDS.split(",")
        // Make sure the requested keywords are valid.
        const allKeywords      = (await Keyword.get(validTypes)).map(keyword => keyword.word)
        const validKeywords    = arrayifiedKeywords
            .filter(keyword => allKeywords.includes(keyword))
            // Sort them in alphabetical order... (More on this later...)
            .sort((a, b) => a.localeCompare(b))

        // FIXME: It might be possible to do these search via FULLTEXT indexes using `IN BOOLEAN MODE`...
        // UPDATE: I think that would be "as effective"...
        // If multiple `keyword_mode=MODE` are passed, they will be combined into an array, make sure to parse said array and get one string.
        const keywordMode      = KEYWORD_MODE instanceof Array
            ? KEYWORD_MODE[KEYWORD_MODE.length - 1]
            : (KEYWORD_MODE.toUpperCase() === "AND" ? "AND" : "OR")
        const keywordSearchSQL = keywordMode === "AND"
            // If in "AND-mode", use this magic RegEx created here:
            // This also requires the keywords to be sorted alphabetically.
            ? (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("(.*,|)")})(?=,|$)'` : "")
            // Otherwise, use "OR-mode" with this magic RegEx:
            : (validKeywords[0] ? `AND keywords RLIKE '(?-i)(?<=,|^)(${validKeywords.join("|")})(?=,|$)'` : "")

        // Make sure the requested sort field is valid, or fall back to `name`.
        // If multiple `sort=SORT` are passed, they will be combined into an array, make sure to parse said array and get one string.
        const sort = SORT instanceof Array ? SORT[SORT - 1] : SORT
        const sortSearchSQL    = `${VALID_SORT_FIELDS.includes(sort) ? sort : "name"}`

        // If multiple `reverse=X` are passed, they will be combined into an array, make sure to parse said array and get one string.
        const reverse = REVERSE instanceof Array ? REVERSE[REVERSE.length - 1] : REVERSE
        // Since the expected order of `relevance` is descending, while all others are ascending,
        // this has to be used to make sure reverse (and not reverse) sorts the result in the
        // correct order... Basically:
        // If sort by relevance AND reverse is on      --> Ascending
        // If sort by relevance AND reverse is off     --> Descending
        // If sort by not relevance AND reverse is on  --> Descending
        // If sort by not relevance AND reverse is off --> Ascending
        const reverseSearchSQL  = sortSearchSQL === "relevance"
            ? (reverse === "1" || reverse === "on" || reverse === "true" ? "ASC"  : "DESC")
            : (reverse === "1" || reverse === "on" || reverse === "true" ? "DESC" : "ASC" )

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
                freetext: FREETEXT instanceof Array ? FREETEXT.join(",") : FREETEXT,
                validTypes
            }
        ).then(
            result => res.sendit(result)
        ).catch(
            err => {
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "Encountered an error while searching the database!"))
                log.error("Encountered an error while searching the database!")
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
        // NOTE: This might now be unnecessary since errors aren't implicitely sent as HTML any more.
        const rawItemID         = req.params.id
        const fixedLengthItemID = rawItemID.length > 16 ? rawItemID : rawItemID.substring(0, 16)
        const sanitisedItemID   = fixedLengthItemID.replace(/[<>]+/g, "").replace(/script/gi, "")

        Item.get(sanitisedItemID)
            .then(item => res.sendit(item))
            .catch(err => {
                if (err === "NO_EXISTS")
                    return res.failit(HusmusenError(404, "ERR_OBJECT_NOT_FOUND", `There exists no item with ItemID '${sanitisedItemID}'!`))

                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", `There was an error while getting item with ItemID '${sanitisedItemID}'!`))
                log.error("Encountered an error while getting the item!")
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
            itemData,
            customData
        } = req.data

        Item.create(
            name,
            description,
            keywords,
            type,
            itemData,
            customData
        ).then(
            item =>
                // When the Item is created, it must be saved.
                Item.save(item)
                    .then(item => {
                        res.sendit(item)
                        log.write(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' created item with ID '${item.itemID}'.`)
                    })
                    // If errors are encountered, handle them:
                    .catch(err => {
                        if (err.code === "ER_DUP_ENTRY")
                            return res.failit(HusmusenError(500, "ERR_ALREADY_EXISTS",`The itemID '${item.itemID}' is already taken!`))

                        res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "Error while saving the item!"))
                        log.error("There was an error saving an item...")
                        console.error(err)
                    })
        ).catch(
            err => {
                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", err))
                log.error("There was an error creating an item...")
                console.error(err)
            }
        )
    }
)

// Let users and admins edit Items.
itemApi.post(
    "/edit",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const originalItemID = req.data.itemID
        const {
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        } = req.data.newItemData

        Item.update(
            originalItemID,
            name,
            description,
            keywords,
            type,
            itemID,
            itemData,
            customData
        ).then(
            item => {
                res.sendit(item)
                log.write(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' edited item that had the ID '${originalItemID}', that now has the ID '${itemID}'.`)
            }
        ).catch(
            err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", err))
                log.error("Encountered an error while editing an item!")
                console.error(err)
            }
        )
    }
)

// Let users and admins mark Items as expired.
itemApi.post(
    "/mark",
    authHandler({ requiresAdmin: false }),
    (req, res) => {
        const itemID = req.data.itemID

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
                                log.write(`${req.auth.isAdmin ? "Admin" : "User"} '${req.auth.username}' marked item with ID '${itemID}'. Reason: ${reason}`)
                            })
                        .catch(
                            err => {
                                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an marking the item..."))
                                log.error("Encountered an error while marking the item!")
                                console.error(err)
                            }
                        )
                }
            )
            .catch(
                err => {
                    res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an marking the item..."))
                    log.error("Encountered an error while marking the item!")
                    console.error(err)
                }
            )
    }
)

// Let admins, and admins only, permanently delete Items.
itemApi.post(
    "/delete",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        const itemID = req.data.itemID

        Item.get(itemID)
            .then(
                itemInDatabase => {
                    // Make sure the item exists
                    if (!itemInDatabase)
                        return res.failit(HusmusenError(400, "ERR_OBJECT_NOT_FOUND", "That item doesn't exist!"))

                    // Delete it and handle errors.
                    Item.delete(itemID)
                        .then(
                            () => {
                                res.sendit(itemInDatabase)
                                log.write(`Admin '${req.auth.username}' deleted item with ID '${itemID}'.`)
                            }
                        )
                        .catch(
                            err => {
                                res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an error deleting the item..."))
                                log.error("Encountered an error while deleting the item!")
                                console.error(err)
                            }
                        )
                }

            )
            .catch(
                err => {
                    res.failit(HusmusenError(500, "ERR_DATABASE_ERROR", "There was an deleting the item..."))
                    log.error("Encountered an error while deleting the item!")
                    console.error(err)
                }
            )
    }
)

export default itemApi