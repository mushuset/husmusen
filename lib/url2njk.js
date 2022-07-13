import fs from "fs"

export default function url2njk(req, res) {
    const pathWithoutApp = req.path.replace("/app", "")
    const sanitizedPath  = pathWithoutApp.replace(/\.\.+/g, "")
    const path           = sanitizedPath ? sanitizedPath : "/" // Make sure the path isn't empty (""); it must at least be "/".

    if (fs.existsSync(`app/pages${path}.njk`))
        return res.render(`pages${path}.njk`)

    if (fs.existsSync(`app/pages${path}/index.njk`))
        return res.render(`pages${path}/index.njk`)

    return res.status(404).end()
}