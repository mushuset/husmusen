import checkIfLoggedIn from "./checkIfLoggedIn.js"
import checkSuccess from "./checkSuccess.js"

// If the user isn't logged in, redirect them to the login page.
// TODO: Maybe fix a pop-up instead?
checkIfLoggedIn().then().catch(() => window.location.replace("/app/login"))

// Select all forms.
const forms = document.querySelectorAll("form")

// Make sure all forms are handled in a non-default way.
for (const form of forms) {
    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault()
            const formData = new FormData(form)

            // Read all keys and values into the `payload` variable.
            let payload = {}
            formData.forEach((value, key) => payload[key] = value)

            // Send a request using the action and method defined in the form-HTML element.
            // Also, send the payload as the body.
            fetch(
                form.getAttribute("action"),
                {
                    method: form.getAttribute("method"),
                    headers: {
                        "Husmusen-Access-Token": localStorage.getItem("api-token")
                    },
                    body: JSON.stringify(payload)
                }
            )
                .then(checkSuccess)
                .then(
                    data => alert("Klar! Information: " + JSON.stringify(data))
                )
                .catch(
                    err => {
                        alert("Error! Kolla i konsolen för mer information.")
                        console.error(err)
                    }
                )
        }
    )
}