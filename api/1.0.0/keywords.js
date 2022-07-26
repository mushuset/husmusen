import { Router } from "express"
import { ItemTypes } from "../../models/Item.js"
import Keyword from "../../models/Keyword.js"
import authHandler from "../../lib/authHandler.js"
import getLogger from "../../lib/log.js"
import colors from "colors"

const keywordApi = Router()
const log = getLogger("Database |", "magenta")

keywordApi.get(
    "/",
    (req, res) => {
        Keyword.get(ItemTypes)
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.status(500).send("There was an error getting the keywords...")
                log(colors.red("ERROR!"), "Encountered an error while getting the keywords!")
                console.error(err)
            })
    }
)

keywordApi.get(
    "/:types",
    (req, res) => {
        const types      = req.params.types.split(",")
        const validTypes = types.filter(type => ItemTypes.includes(type))

        if (!validTypes[0])
            return res.status(400).send("You included no valid types! Please use one of the following: " + ItemTypes.join(", "))

        Keyword.get(validTypes)
            .then(keywords => res.sendit(keywords))
            .catch(err => {
                res.status(500).send("There was an error getting the keywords...")
                log(colors.red("ERROR!"), "Encountered an error while getting keywords!")
                console.error(err)
            })
    }
)

keywordApi.post(
    "/",
    authHandler({ requiresAdmin: true }),
    (req, res) => {
        /**
         * @type {Array<import("../../models/Keyword.js").Keyword>}
         */
        const keywords = req.data

        const keywordsTextData = keywords
            .map(keyword => `${keyword.type}: ${keyword.word}: ${keyword.description}`)
            .filter((a, b) => a.localeCompare(b))
            .join("\n")

        Keyword.save(keywordsTextData)
            .then(() => res.sendit(keywords))
            .catch(err => {
                res.status(500).send("There was an error saving the keywords...")
                log(colors.red("ERROR!"), "Encountered an error while saving keywords!")
                console.error(err)
            })
    }
)

export default keywordApi