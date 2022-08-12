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

/**
 * This function creates a Buffer from a Blob.
 * @param {Blob} blob
 * @returns {Promise<Buffer>}
 */
function getFileDataBufferToDataURL(blob) {
    return new Promise(
        (resolve, reject) => {
            const reader = new FileReader()
            reader.onload = result => resolve(result.target.result)
            reader.readAsDataURL(blob)
            reader.onerror = err => reject(err)
        }
    )
}

// Set up the file creation form.
const fileCreationForm = document.querySelector("#file-creation-form")
fileCreationForm?.addEventListener(
    "submit",
    async event => {
        event.preventDefault()
        const formData = new FormData(fileCreationForm)
        const file     = formData.get("fileDataBuffer")
        const fileMIME = file.type

        const rawFileData    = document.querySelector("#file-data-buffer").files[0]
        const fileDataURL = await getFileDataBufferToDataURL(rawFileData)
            .catch(
                err => {
                    alert("Error! Kolla i konsolen för mer information.")
                    console.error(err)
                }
            )

        const payload = {
            name: formData.get("name"),
            description: formData.get("description"),
            license: formData.get("license"),
            relatedItem: formData.get("relatedItem"),
            type: fileMIME,
            fileDataURL
        }

        // console.dir({ fileDataBuffer, fileDataBufferJSON: Array.from(new Uint8Array(fileDataBuffer)) })

        fetch(
            fileCreationForm.getAttribute("action"),
            {
                method: fileCreationForm.getAttribute("method"),
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
editItemForm?.addEventListener(
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
${newItemData.replace(/^(?!$)/gm, "  ")}`

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

// FIXME: This looks very much like the above function.
// It could probably be generalised to have one function for each.
// ---
// Handle the edit-file-form:
const editFileForm = document.querySelector("#edit-file-form")
editFileForm?.addEventListener(
    "submit",
    event => {
        event.preventDefault()
        const formData    = new FormData(editFileForm)
        const fileID      = formData.get("fileID")
        const newFileData = formData.get("newFileData")

        // This part has to look like this so the YAML gets formatted properly.
        const payload = `\
fileID: ${fileID}
newFileData:
${newFileData.replace(/^(?!$)/gm, "  ")}`

        fetch(
            editFileForm.getAttribute("action"),
            {
                method: editFileForm.getAttribute("method"),
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