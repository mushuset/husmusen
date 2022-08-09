import checkIfLoggedIn from "./checkIfLoggedIn.js"
import checkSuccess from "./checkSuccess.js"

const form = document.querySelector("#login-form")

// This will redirect the user to the control panel if they are already logged in.
checkIfLoggedIn().then(() => window.location.replace("/app/control_panel")).catch()

// Set up the form to work properly.
form.addEventListener(
    "submit",
    event => {
        event.preventDefault()
        const formData = new FormData(form)
        const username = formData.get("username")
        const password = formData.get("password")
        const requestPayload = JSON.stringify({ username, password })

        fetch(
            "/api/auth/login",
            {
                body: requestPayload,
                method: "POST",
            }
        )
            // Handle the response.
            .then(checkSuccess)
            // Handle the response data.
            .then(
                data => {
                    console.log(data)
                    localStorage.setItem("api-token", data.token)
                    localStorage.setItem("api-token-valid-until", data.validUntil)
                    location.assign("/app/control_panel")
                }
            )
            // Catch errors.
            .catch(
                err => {
                    if (err.errorCode === "ERR_INVALID_PASSWORD")
                        return alert("Fel lösenord!")

                    alert("Error! Kolla i konsolen för mer information.")
                    console.error(err)
                }
            )
    }
)