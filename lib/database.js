import mariadb from "mariadb"
import getLogger from "./log.js"

const log = getLogger("Database", "magenta")

export const db = null

export async function startDB(host, user, pass) {
    log("Connecting to database:", host)
    /* const connection = mariadb.createConnection({
        host,
        user,
        pass
    }) */
}