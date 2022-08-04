import fs from "fs"

export default function url2njk(req, res) {
    // Make sure to sanitize the URL so that a user can't traverse the filesystem using '../../..' and alike...
    const pathWithoutApp = req.path.replace("/app", "")
    const sanitizedPath  = pathWithoutApp.replace(/\.\.+/g, "")
    const path           = sanitizedPath ? sanitizedPath : "/"

    if (fs.existsSync(`app/views/pages${path}.njk`))
        return res.render(`pages${path}.njk`)

    if (fs.existsSync(`app/views/pages${path}/index.njk`))
        return res.render(`pages${path}/index.njk`)

    // TODO: Add an actual 404-error page for better user experience...
    return res.status(404).send("404: Page not found.")
}