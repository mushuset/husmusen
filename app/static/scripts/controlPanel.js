import checkIfLoggedIn from "./checkIfLoggedIn.js"
import checkSuccess from "./checkSuccess.js"

// If the user isn't logged in, redirect them to the login page.
// TODO: Maybe fix a pop-up instead?
checkIfLoggedIn().then().catch(() => window.location.replace("/app/login"))

const forms = document.querySelectorAll("form")

for (const form of forms) {
    form.addEventListener(
        "submit",
        async (event) => {
            event.preventDefault()
            const formData = new FormData(form)
            let payload = {}
            formData.forEach((value, key) => payload[key] = value)
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