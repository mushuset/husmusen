/**
 * @typedef {(
 *  "ERR_UNKNOWN_ERROR"     |
 *  "ERR_OBJECT_NOT_FOUND"  |
 *  "ERR_FILE_NOT_FOUND"    |
 *  "ERR_USER_NOT_FOUND"    |
 *  "ERR_MISSING_PARAMETER" |
 *  "ERR_INVALID_PARAMETER" |
 *  "ERR_ALREADY_EXISTS"    |
 *  "ERR_DATABASE_ERROR"    |
 *  "ERR_FILESYSTEM_ERROR"  |
 *  "ERR_INVALID_PASSWORD"  |
 *  "ERR_FORBIDDEN_ACTION"
 * )} ErrorCode
 */

/**
 * @typedef {object} HusmusenError
 * @property {number} httpStatusCode The HTTP status code. 400 - bad request, 402 - unautorised, 500 - internal server error, etc.
 * @property {ErrorCode} errorCode An error code.
 * @property {string} errorDescription A more in-depth description of the error.
 */

/**
 * Creates an error
 * @param {number} httpStatusCode The HTTP status code. 400 - bad request, 402 - unautorised, 500 - internal server error, etc.
 * @param {ErrorCode} errorCode An error code.
 * @param {string} errorDescription A more in-depth description of the error.
 * @returns {HusmusenError}
 */
export default function HusmusenError(httpStatusCode, errorCode, errorDescription) {
    return { httpStatusCode, errorCode, errorDescription }
}
