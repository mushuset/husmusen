import colors from "colors"

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
    const clr = colors[color] ? color : "blue"

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
        const seconds = now.getSeconds()
        const logTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`
        console.log(`${colors[clr](prefix)} ${colors.grey(logTime)} >`, ...args)
    }

    return logger
}