import { Router } from "express"
import YAML from "yaml"
import authHandler from "../lib/authHandler.js"
import DBInfo from "../models/DBInfo.js"
import Item from "../models/Item.js"

const routes = Router()

routes.get("/", (_, res) => res.render("pages/index.njk"))

routes.get("/search", (_, res) => res.render("pages/search.njk"))

routes.get(
    "/item/:itemID",
    (req, res) => Item.get(req.params.itemID)
        .then(item => res.render("pages/item.njk", { item }))
        .catch(err => res.render("pages/item.njk", { err  }))
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
    (req, res) => res.render(
        "pages/control_panel/new_item.njk",
        {
            queries: req.query
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

routes.get("/control_panel/log", (_, res) => res.render("pages/control_panel/log.njk"))

if (process.env.DEBUG === "true")
    routes.get("/setup", (_, res) => res.render("pages/setup.njk"))

export default routes