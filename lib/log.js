import colors from "colors"
import { createWriteStream } from "fs"

const logWriteStream = createWriteStream("./data/husmusen.log", { flags: "a" })
logWriteStream.write("\n\n")

/**
 * @typedef {Function} LoggerFunction
 * @param {*} _ Takes however many arguments and prints them to the console.
 */

/**
 * Creates a logger function that logs like this: "<prefix> <date + time> <message>"
 * @param {String} prefix A prefix for the logger, e.g. "MAIN", "Database", ...
 * @param {String} color  The color of the prefix, e.g. "blue", "red", ...
 * @returns {LoggerFunction} The logger function
 */
export default function getLogger(prefix, color) {
    const clr           = colors[color] ? color : "blue"
    const coloredPrefix = colors[clr](prefix)

    /**
     * @const {LoggerFunction}
     */
    const logger = function(...args) {
        const now     = new Date(Date.now())
        const year    = now.getFullYear()
        const month   = now.getMonth()
        const day     = now.getDate()
        const hours   = now.getHours()
        const minutes = now.getMinutes()
        const seconds = now.getSeconds() < 10 ? `0${now.getSeconds()}` : now.getSeconds()
        const logTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
        console.log(`${coloredPrefix} ${colors.grey(logTime)} >`, ...args)
        logWriteStream.write(`${prefix.replace(/\s+\|/g, "")};${logTime};${colors.strip(args.join(" "))}\n`)
    }

    return logger
}