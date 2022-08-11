import colors from "colors"
import mariadb from "mariadb"
import getLogger from "./log.js"

const log = getLogger("Database |", "magenta")

/**
 * @type {mariadb.Pool}
 */
let DBPool = null

/**
 * Connect to a MariaDB server and database.
 * @param {string}        host     The host of the MariaDB server.
 * @param {string|number} port     The port for the MariaDB server.
 * @param {string}        user     The user to connect as.
 * @param {string}        password The user's password.
 * @param {string}        database Name of the database to connect to on the server.
 */
export async function startDB(host, port, user, password, database) {
    log.write(`Connecting to database: ${host}/${database}`)
    const pool = mariadb.createPool({
        host,
        port,
        user,
        password,
        database,
        connectionLimit: 5
    })

    DBPool = pool

    // The following lines/the rest of the function is a hot mess.
    // Summary:
    //  1. Make sure all tables exist, otherwise create them.
    //  2. Make sure all indexes exist, otherwise create them.
    //  3. Close the current connection, leaving the `DBPool` open.

    log.write("Testing database...")
    const con  = await pool.getConnection()
    const test = await con.query("SELECT 'Database connection works!' AS test")
        .catch(err => {
            log.error("Seems as if the connection to the database doesn't work!")
            throw err
        })
    log.write(colors.green("SUCCESS!"), test[0].test)

    log.write("Making sure tables exists...")
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
    `).catch(err => log.error(err))

    await con.query(`
        CREATE TABLE IF NOT EXISTS husmusen_users (
            username VARCHAR(32)  UNIQUE NOT NULL,
            password VARCHAR(128) NOT NULL,
            isAdmin  BOOLEAN      DEFAULT 0
        )
    `).catch(err => log.error(err))

    await con.query(`
        CREATE TABLE IF NOT EXISTS husmusen_files (
            name        VARCHAR(128) NOT NULL,
            type        VARCHAR(128) NOT NULL,
            license     VARCHAR(128) DEFAULT 'All rights reserved',
            fileID      VARCHAR(40)  UNIQUE NOT NULL,
            addedAt     TIMESTAMP    DEFAULT current_timestamp,
            updatedAt   TIMESTAMP    DEFAULT current_timestamp,
            relatedItem INTEGER      NOT NULL
        )
    `).catch(err => log.error(err))
    log.write("All tables exists or are now created!")

    log.write("Making sure indexes exists...")
    await con.query(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_itemID
        ON husmusen_items (itemID)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_name
        ON husmusen_items (name)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_keywords
        ON husmusen_items (keywords)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_description
            ON husmusen_items (description)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE INDEX IF NOT EXISTS idx_type
        ON husmusen_items (type)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_itemData
            ON husmusen_items (itemData)
    `).catch(err => log.error(err))

    await con.query(`
        CREATE FULLTEXT INDEX IF NOT EXISTS idx_customData
            ON husmusen_items (customData)
    `).catch(err => log.error(err))
    log.write("All indexes exists or are now created!")

    // The connection must be closed/ended, otherwise it will be open indefinitely.
    con.end()
}

/**
 * Query the database with an SQL statement, optional variables/arguments, and whether or not to only return the first result.  \
 * **IMPORTANT!** If `onlyFirst` is true your SQL statement might still send back 1000 results, but only the first one will be returned.
 * In such a case, if not guaranteed only one result (e.g. via a UNIQUE key), limit your result with the `LIMIT` function.
 * @param {string|mariadb.QueryOptions} query The SQL query.
 * @param {Array|object=}                vars Variables/arguments to use. (Optional)
 * @param {boolean=}          onlyFirstResult Unwrap the first result and return only that. (Optional)
 * @returns {Promise} A promise resolving the found data or rejecting with an error.
 */
export function queryDB(query, vars, onlyFirstResult) {
    return new Promise(
        (resolve, reject) => {
            DBPool.getConnection()
                .then(con => {
                    const queryPromise = con.query(query, vars)
                    con.end()
                    return queryPromise
                })
                .then(
                    data => {
                        // By default there's a lot of metadata. It can be annoying and make `data[0]`
                        // contain metadata instead of the *actual result*. Therefore delete it, so it
                        // can't cause any problems.
                        delete data.meta

                        if (onlyFirstResult)
                            return resolve(data[0])

                        resolve(data)
                    }
                ).catch(
                    err => reject(err)
                )
        }
    )
}