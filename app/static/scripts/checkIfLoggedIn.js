import checkSuccess from "./checkSuccess.js"

/**
 * Check if the user is logged in.
 * @returns {Promise} Promise that resolves if the user is logged in or rejects on error or not logged in.
 */
export default function checkIfLoggedIn() {
    return new Promise(
        (resolve, reject) => {
            if (!localStorage.getItem("api-token"))
                return reject()

            if (new Date(Date.now()) > new Date(localStorage.getItem("api-token-valid-until")))
                return reject()

            fetch(
                "/api/auth/who",
                {
                    headers: {
                        "Husmusen-Access-Token": localStorage.getItem("api-token")
                    },
                    body: "{}",
                    method: "POST",
                }
            )
                .then(checkSuccess)
                .then(() => resolve())
                .catch(() => reject())
        }
    )
}