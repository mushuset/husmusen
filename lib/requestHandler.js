import YAML from "yaml"
import getLogger from "./log.js"

const log = getLogger("Req-Hand |", "yellow")

/**
 * Gets the raw data from a request.
 * @param {request} req The request.
 * @returns {Promise} A promise resolving with the data or rejecting with an error.
 */
function getRequestData(req) {
    return new Promise(
        (resolve, reject) => {
            let data = ""
            req.on("data",  chunk => data += chunk)
            req.on("error", error => reject(error))
            req.on("end",   ()    => resolve(data))
        })
}

/**
 * @const inputFormatHandlers A hashmap of different input formats and how to handle them...
 */
const inputFormatHandlers = {
    "application/json": data => JSON.parse(data),
    "application/yaml": data => YAML.parse(data),
}

/**
 * @const outputFormatHandlers A hashmap of different output formats and how to handle them...
 */
const outputFormatHandlers = {
    "application/json": data => JSON.stringify(data),
    "application/yaml": data => YAML.stringify(data),
}

/**
 * @const defaultData Default values for various data formats.
 */
const defaultData = {
    "application/json": "{}",
    "application/yaml": "",
}

/**
 * This makes the input data available on `req.data` and the response formatter available on `res.sendit`
 * @param {request} req
 * @param {response} res
 * @param {Function} next
 */
export default function requestHandler(req, res, next) {
    const inputFormat  = req.header("Content-Type") ?? "application/json"
    const outputFormat = req.header("Husmusen-Output-Format") ?? "application/json"

    getRequestData(req)
        .then(
            data => {
                // This makes sure the request has a valid input format, otherwise it will fall back on `application/json`
                const inputParser = Object.keys(inputFormatHandlers).includes(inputFormat)
                    ? inputFormatHandlers[inputFormat]
                    : inputFormatHandlers["application/json"]
                // Parse the input and add it to `req.data`
                const inputData = inputParser(data || defaultData[inputFormat])
                req.data = inputData

                // This makes sure the request has a valid output format, otherwise it will fall back on `application/json`
                const outputFormatter = Object.keys(outputFormatHandlers).includes(outputFormat) ? outputFormatHandlers[outputFormat] : outputFormatHandlers["application/json"]
                /**
                 * This takes an object or an array and formats it and sends it back to the requester.
                 * @param {object|Array} outputData The data to send back.
                 * @returns {void}
                 */
                res.sendit = outputData => res
                    .header("Content-Type", outputFormat)
                    .status(200)
                    .send(outputFormatter(outputData))

                /**
                 * This makes it so an error can be sent back to the requester via `res.failit`.
                 * @param {import("../models/Error.js").HusmusenError} husmusenError A {@link import("../models/Error.js").HusmusenError}.
                 * @returns
                 */
                res.failit = (husmusenError) => res
                    .header("Content-Type", outputFormat)
                    .status(husmusenError.httpStatusCode)
                    .send(outputFormatter({
                        errorCode: husmusenError.errorCode,
                        errorDescription: husmusenError.errorDescription
                    }))

                // Continue request...
                next()
            }
        )
        .catch(
            error => {
                log.error("There was an error with the request handler!")
                console.error(error)
                res.status(500).send("There was an error with the request handler!")
            }
        )
}