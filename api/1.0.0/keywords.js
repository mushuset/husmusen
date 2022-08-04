import colors from "colors"
import { Router } from "express"
import authHandler from "../../lib/authHandler.js"
import getLogger from "../../lib/log.js"
import HusmusenError from "../../models/Error.js"
import { ItemTypes } from "../../models/Item.js"
import Keyword from "../../models/Keyword.js"

const keywordApi = Router()
const log = getLogger("Database |", "magenta")

// Gets all keywords for all types.
keywordApi.get(
    "/",
    (req, res) => {
        Keyword.get(ItemTypes)
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error getting the keywords..."))
                log(colors.red("ERROR!"), "Encountered an error while getting the keywords!")
                console.error(err)
            })
    }
)

// Gets all keywords for all the specified types.
// Types are specified like this: /api/1.0.0/keyword/Type1,Type2,Type3
// AKA the types are comma-separated in the URL.
keywordApi.get(
    "/:types",
    (req, res) => {
        const types      = req.params.types.split(",")
        const validTypes = types.filter(type => ItemTypes.includes(type))

        if (!validTypes[0])
            return res.failit(HusmusenError(400, "ERR_MISSING_PARAMETER", "You included no valid types! Please use one of the following: " + ItemTypes.join(", ")))

        Keyword.get(validTypes)
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error getting the keywords..."))
                log(colors.red("ERROR!"), "Encountered an error while getting keywords!")
                console.error(err)
            })
    }
)

// Allows an admin to configure keywords...
keywordApi.post(
    "/",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        /**
         * @type {Array<import("../../models/Keyword.js").Keyword>}
         */
        const keywords = req.data

        Keyword.save(keywords)
            .then(() => Keyword.get(ItemTypes))
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.failit(HusmusenError(500, "ERR_UNKNOWN_ERROR", "There was an error saving the keywords..."))
                log(colors.red("ERROR!"), "Encountered an error while saving keywords!")
                console.error(err)
            })
    }
)

export default keywordApi