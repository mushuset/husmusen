import { Router } from "express"
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

routes.get("/control_panel", (_, res) => res.render("pages/control_panel/index.njk"))

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
    (req, res) => res.render(
        "pages/control_panel/edit_item.njk",
        {
            queries: req.query
        }
    )
)

routes.get("/control_panel/log", (_, res) => res.render("pages/control_panel/log.njk"))

export default routes