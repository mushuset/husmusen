import mariadb from "mariadb"
import colors from "colors"
import getLogger from "./log.js"

const log = getLogger("Database |", "magenta")

export const db = null

export function startDB(host, port, user, password) {
    log("Connecting to database:", host)
    const pool = mariadb.createPool({
        host,
        port,
        user,
        password,
        connectionLimit: 5
    })

    log("Testing database...")
    pool.getConnection()
        .then(con  => con.query("SELECT 'Database connection works!' AS test"))
        .then(rows => log(colors.green("SUCCESS!"), rows[0].test))
        .catch(err => {
            log(colors.red("WARNING!"), "Seems as if the connection to the database doesn't work!")
            console.error(err)
        })
}