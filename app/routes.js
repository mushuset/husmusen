import { Router } from "express"
import YAML from "yaml"
import DBInfo from "../models/DBInfo.js"
import File from "../models/File.js"
import Item, { ItemTypes } from "../models/Item.js"
import Keyword from "../models/Keyword.js"

const routes = Router()

routes.get("/", (_, res) => res.render("pages/index.njk"))

routes.get("/search", (req, res) => res.render("pages/search.njk", { queries: req.query }))

routes.get(
    "/item/:itemID",
    (req, res) => Item.get(req.params.itemID)
        .then(item => res.render("pages/item.njk", { item }))
        .catch(err => res.render("pages/item.njk", { err  }))
)

routes.get(
    "/file/:fileID",
    (req, res) => File.get(req.params.fileID)
        .then(file => res.render("pages/file.njk", { file }))
        .catch(err => res.render("pages/file.njk", { err  }))
)

routes.get(
    "/keywords",
    (req, res) => Keyword.get(ItemTypes)
        .then(keywords => res.render("pages/keywords.njk", { keywords }))
        .catch(err     => res.render("pages/keywords.njk", {   err    }))
)

routes.get(
    "/db_info",
    (_, res) => DBInfo.get()
        .then(dbInfo => res.render("pages/db_info.njk", { dbInfo }))
        .catch(err   => res.render("pages/db_info.njk", {  err   }))
)

routes.get("/about", (_, res) => res.render("pages/about.njk"))

routes.get("/login", (_, res) => res.render("pages/login.njk"))

routes.get("/control_panel", (req, res) => res.render("pages/control_panel/index.njk", { auth: req.auth }))

routes.get(
    "/control_panel/new_item",
    async (req, res) => res.render(
        "pages/control_panel/new_item.njk",
        {
            queries: req.query,
            nextItemID: await Item.getNextItemID().catch()
        }
    )
)

routes.get(
    "/control_panel/edit_item",
    (req, res) => Item.get(req.query.itemID)
        .then(
            item => res.render(
                "pages/control_panel/edit_item.njk",
                {
                    itemID: req.query.itemID,
                    // Only send what is needed.
                    // Fields such as `addedAt` cannot be modified anyways.
                    itemAsYAML: YAML.stringify({
                        itemID: item.itemID,
                        name: item.name,
                        keywords: item.keywords,
                        description: item.description,
                        type: item.type,
                        itemData: item.itemData,
                        customData: item.customData
                    })
                }
            )
        )
        .catch(
            err => res.render("pages/control_panel/edit_item.njk", { err })
        )
)

routes.get(
    "/control_panel/edit_file",
    (req, res) => File.get(req.query.fileID)
        .then(
            file => res.render(
                "pages/control_panel/edit_file.njk",
                {
                    fileID: req.query.fileID,
                    // Only send what is needed.
                    // Fields such as `addedAt` cannot be modified anyways.
                    fileAsYAML: YAML.stringify({
                        name: file.name,
                        description: file.description,
                        license: file.license,
                        relatedItem: file.relatedItem
                    })
                }
            )
        )
        .catch(
            err => res.render("pages/control_panel/edit_file.njk", { err })
        )
)

routes.get(
    "/control_panel/edit_keywords",
    (req, res) => Keyword.get(ItemTypes)
        .then(
            keywords => res.render(
                "pages/control_panel/edit_keywords.njk",
                {
                    keywordsAsText: keywords
                        // Format keywords as text.
                        .map(keyword => `${keyword.type}: ${keyword.word}: ${keyword.description}`)
                        // Sort the keywords alphabetically...
                        .sort((a, b) => a.localeCompare(b))
                        .join("\n")
                }
            )
        )
        .catch(
            err => res.render("pages/control_panel/edit_keywords.njk", { err })
        )
)

routes.get(
    "/control_panel/edit_dbinfo",
    (_, res) => DBInfo.get()
        .then(dbInfo => res.render("pages/control_panel/edit_dbinfo.njk", { dbInfoAsYAML: YAML.stringify(dbInfo) }))
        .catch(err => res.render("pages/control_panel/edit_dbinfo.njk", { err }))
)

routes.get("/control_panel/log", (_, res) => res.render("pages/control_panel/log.njk"))

if (process.env.DEBUG === "true")
    routes.get("/setup", (_, res) => res.render("pages/setup.njk"))

export default routes