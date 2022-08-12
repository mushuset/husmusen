import checkIfLoggedIn from "./checkIfLoggedIn.js"
import checkSuccess from "./checkSuccess.js"

// If the user isn't logged in, redirect them to the login page.
// TODO: Maybe fix a pop-up instead?
checkIfLoggedIn().then().catch(() => window.location.replace("/app/login"))

// Select all forms that have the `auto-rig` class.
const forms = document.querySelectorAll("form.auto-rig")
// Make sure said forms are handled in a special way:
for (const form of forms) {
    form.addEventListener(
        "submit",
        async (event) => {
            // Make sure the default way of handling submition is ignored.
            event.preventDefault()

            // Get all data.
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

// Select all forms that have the `YAML` class.
const YAMLforms = document.querySelectorAll("form.YAML")
// Make sure said forms are handled in another special way:
for (const form of YAMLforms) {
    form.addEventListener(
        "submit",
        event => {
            // Make sure the default way of handling submition is ignored.
            event.preventDefault()

            // Get all data.
            const formData = new FormData(form)

            // Get the payload from the `YAML`-field.
            let payload = formData.get("YAML")

            // Send a request using the action and method defined in the form-HTML element.
            // Also, send the payload as the body.
            fetch(
                form.getAttribute("action"),
                {
                    method: form.getAttribute("method"),
                    headers: {
                        "Husmusen-Access-Token": localStorage.getItem("api-token"),
                        "Content-Type": "application/yaml"
                    },
                    body: payload
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

// Make it so that the user can log out.
// This deletes the current API token.
document.querySelector("#log-out-form")
    ?.addEventListener(
        "submit",
        event => {
            event.preventDefault()
            localStorage.removeItem("api-token")
            localStorage.removeItem("api-token-valid-until")
            window.location.assign("/app")
        }
    )


// Handle the edit-item-form:
const editItemForm = document.querySelector("#edit-item-form")
editItemForm.addEventListener(
    "submit",
    event => {
        event.preventDefault()
        const formData    = new FormData(editItemForm)
        const itemID      = formData.get("itemID")
        const newItemData = formData.get("newItemData")

        // This part has to look like this so the YAML gets formatted properly.
        const payload = `\
itemID: ${itemID}
newItemData:
${newItemData.replace(/^(?!$)/gm, "  ")}
`
        console.log(payload)

        fetch(
            editItemForm.getAttribute("action"),
            {
                method: editItemForm.getAttribute("method"),
                headers: {
                    "Husmusen-Access-Token": localStorage.getItem("api-token"),
                    "Content-Type": "application/yaml"
                },
                body: payload
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