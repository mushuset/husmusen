import { request, response } from "express"
import colors from "colors"
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
            let data = ''
            req.on("data",  chunk => data += chunk)
            req.on("error", error => reject(error))
            req.on("end",   ()    => resolve(data))
        })
}

const inputFormatHandlers = {
    "application/json": data => JSON.parse(data),
    "application/yaml": data => YAML.parse(data),
}

const outputFormatHandlers = {
    "application/json": data => JSON.stringify(data),
    "application/yaml": data => YAML.stringify(data),
}

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

    getRequestData(req).then(
        data => {
            // Set the input data at `req.data`
            const inputFormatter = Object.keys(inputFormatHandlers).includes(inputFormat) ? inputFormatHandlers[inputFormat] : inputFormatHandlers["application/json"]
            const inputData = inputFormatter(data || defaultData[inputFormat])
            req.data = inputData

            // Set the input data at `req.data`
            const outputFormatter = Object.keys(outputFormatHandlers).includes(outputFormat) ? outputFormatHandlers[outputFormat] : outputFormatHandlers["application/json"]
            res.sendit = outputData => res.header("Content-Type", outputFormat).status(200).send(outputFormatter(outputData))

            // Continue request...
            next()
        }
    ).catch(
        error => {
            log(colors.red("ERROR!"), "There was an error with the request handler!")
            console.error(error)
            res.status(500).send("There was an error with the request handler!")
        }
    )
}