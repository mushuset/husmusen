import checkIfLoggedIn from "./checkIfLoggedIn.js"

// TODO: Maybe fix a pop-up instead?
checkIfLoggedIn().then().catch(() => window.location.replace("/app/login"))