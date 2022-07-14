/**
 * @typedef {object} Ok
 * @property {"OK"} status
 * @property {*}    data
 */
/**
 * Returns an 'Ok'-value. (Inspired by Rust error handling.)
 * @param {*} data The data that is okay.
 * @returns {Ok}
 */
export const Ok  = data => { return { status: "OK",    data } }

/**
 * @typedef {object} Err
 * @property {"ERR"} status
 * @property {*}     data
 */
/**
 * Returns an 'Err'-value. (Inspired by Rust error handling.)
 * @param {*} data The data that is okay.
 * @returns {Err}
 */
export const Err = data => { return { status: "ERR", data } }

/**
 * Runs a function and handles errors. Inspired somewhat by Rust.
 * @param {Function} func  A function that returns {@link Ok} or {@link Err}.
 * @param {Function} ifOk  Runs if `func` returns {@link Ok}.
 * @param {Function} ifErr Runs if `func` returns {@link Err}.
 * @returns {*} The data embedded in the {@link Ok} or {@link Err}.
 */
// export function isOk(func) {
//     return new Promise(
//         (resolve, reject) => {
//             const funcResult = func()

//             if (funcResult.status === "OK")
//                 return resolve(funcResult.data)

//             return reject(funcResult.data)
//         }
//     )
// }