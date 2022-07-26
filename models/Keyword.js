import { ItemTypes } from "./Item.js"
import { readFile, writeFile } from "fs/promises"
import { existsSync } from "fs"

/**
 * @typedef {import("./Item").ItemType} ItemType
 */

/**
 * A keyword used to search the database.
 * @typedef {object} Keyword
 * @property {ItemType} type The {@link ItemType} the keyword is for.
 * @property {string}   word The word itself.
 * @property {string}   description A description of when to use the keyword.
 */

/**
 * @type {null|Array<Keyword>}
 */
let keywordCache = null

/**
 * Caches all keywords from `./data/keywords` to {@link keywordCache}.
 * @returns {Promise}
 */
function cacheKeywords() {
    return new Promise(
        async (resolve, reject) => {
            if (!existsSync("./data/keywords.txt"))
                await writeFile("./data/keywords.txt", "").catch(reject)

            readFile("./data/keywords.txt")
                .then(fileData => fileData.toString())
                .then(
                    keywordsAsText => keywordCache = keywordsAsText
                        .split("\n")
                        // Make sure the line is in the format `<TYPE>: <KEYWORD>: <DESCRIPTION>
                        .filter(line => line.match(/^\w+: .+: .+$/))
                        .sort((a, b) => a.localeCompare(b))
                        .map(
                            line => {
                                const [ type, word, ...description ] = line.split(/: +/)
                                const keyword = {
                                    type,
                                    word,
                                    description: description.join(": ")
                                }
                                return keyword
                            }
                        )
                )
                .then(resolve)
                .catch(reject)
        }
    )
}

const Keyword = {
    /**
     * Gets the keywords for specific {@link ItemType ItemTypes}.
     * @param {Array<ItemType>} types The item types that you wish to get the keywords for.
     * @returns {Promise<Array<Keyword>>}
     */
    get: types => new Promise(
        async (resolve, reject) => {
            if (!types)
                return reject("ERR_NO_TYPES")

            const validTypes     = types.filter(type => ItemTypes.includes(type))
            const searchForTypes = validTypes[0] ? validTypes : ItemTypes

            if (!keywordCache)
                await cacheKeywords().catch(reject)

            const foundKeywords = keywordCache.filter(keyword => searchForTypes.includes(keyword.type))

            resolve(foundKeywords)
        }
    ),
    /**
     * Saves a new keyword list.
     * @param {string} keywordTextData The text data of all keywords. Each line is one keyword formatted: `<TYPE> <WORD> <DESCRIPTION>`
     * @returns {Promise}
     */
    save: keywordTextData => new Promise(
        (resolve, reject) => {
            const filteredKeywordTextData = keywordTextData
                .split("\n")
                .filter(line => line.match(/^\w+: .+: .+$/))
                .join("\n")

            writeFile("./data/keywords.txt", filteredKeywordTextData)
                .then(
                    () => {
                        cacheKeywords()
                        resolve()
                    }
                )
                .catch(reject)
        }
    ),
}

export default Keyword