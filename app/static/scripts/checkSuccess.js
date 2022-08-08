/**
 * This function check if a `fetch`-request succeeded ot failed.
 * @param {*} response The response to check.
 * @return {Promise<object|Array>} Returns a promise that resolves if the response succeeded, else it rejects with an error.
*/
export default function checkSuccess(response) {
    return new Promise(
        async (resolve, reject) => {
            if (response.status !== 200)
                return reject(await response.json())

            resolve(await response.json())
        }
    )
}