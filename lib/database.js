import mariadb from "mariadb"
import colors from "colors"
import getLogger from "./log.js"

const log = getLogger("Database |", "magenta")

/**
 * @type {mariadb.Pool}
 */
export let DBPool = null

export async function startDB(host, port, user, password, database) {
    log("Connecting to database:", host)
    const pool = mariadb.createPool({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 5
    })

    DBPool = pool

    log("Testing database...")
    const con  = await pool.getConnection()
    const test = await con.query("SELECT 'Database connection works!' AS test")
        .catch(err => {
            log(colors.red("WARNING!"), "Seems as if the connection to the database doesn't work!")
            throw err
        })

    log(colors.green("SUCCESS!"), test[0].test)

    log("Making sure tables exists...")
    await con.query(`
        CREATE TABLE IF NOT EXISTS husmusen_items (
            itemID        INTEGER      PRIMARY KEY,
            name          VARCHAR(128) NOT NULL,
            keywords      TEXT         DEFAULT '',
            description   TEXT         DEFAULT '',
            type          ENUM(
                "ArtPiece",
                "Blueprint",
                "Book",
                "Building",
                "Collection",
                "Concept",
                "CulturalEnvironment",
                "CulturalHeritage",
                "Document",
                "Exhibition",
                "Film",
                "Group",
                "HistoricalEvent",
                "InteractiveResource",
                "PhysicalItem",
                "Map",
                "Organisation",
                "Person",
                "Photo",
                "Sketch",
                "Sound"
            ),
            addedAt      TIMESTAMP    DEFAULT current_timestamp,
            updatedAt    TIMESTAMP    DEFAULT current_timestamp,
            itemData     JSON         DEFAULT '{}' CHECK (JSON_VALID(itemData)),
            customData   JSON         DEFAULT '{}' CHECK (JSON_VALID(customData)),
            isExpired    BOOLEAN      DEFAULT 0,
            expireReason TEXT         DEFAULT '',
            hasThumbnail BOOLEAN      DEFAULT 0
        )
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE TABLE IF NOT EXISTS husmusen_users (
            username VARCHAR(32)  UNIQUE NOT NULL,
            password VARCHAR(128) NOT NULL,
            isAdmin  BOOLEAN      DEFAULT 0
        )
    `).catch(err => log(colors.red("ERROR!"), err))
    log("All tables exists!")

    log("Making sure indexes exists...")
    await con.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_itemID
        ON husmusen_items (itemID)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_name
        ON husmusen_items (name)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_keywords
        ON husmusen_items (keywords)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_description
            ON husmusen_items (description)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE INDEX IF NOT EXISTS idx_type
        ON husmusen_items (type)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_itemData
            ON husmusen_items (itemData)
    `).catch(err => log(colors.red("ERROR!"), err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_customData
            ON husmusen_items (customData)
    `).catch(err => log(colors.red("ERROR!"), err))

    con.end()
}

/**
 * Query the database with an SQL statement.
 * @param {string} query The SQL query.
 * @param {Array} vars Variables to use.
 * @param {boolean} onlyFirstResult Unwrap the first result and return only that.
 * @returns {Promise} A promise resolving the found data or rejecting with an error.
 */
export function queryDB(query, vars, onlyFirstResult) {
    return new Promise(
        async (resolve, reject) => {
            const con = await DBPool.getConnection().catch(reject)
            con.query(query, vars)
                .then(
                    data => {
                        delete data.meta

                        if (onlyFirstResult)
                            return resolve(data[0])

                        resolve(data)
                    }
                ).catch(reject)
                .finally(() => con.end())

        }
    )
}