import { Router } from "express"
import DBInfo from "../models/DBInfo.js"
import Item from "../models/Item.js"

const routes = Router()

routes.get("/", (req, res) => res.render("pages/index.njk"))

routes.get("/search", (req, res) => res.render("pages/search.njk"))

routes.get(
    "/item/:itemID",
    (req, res) => Item.get(req.params.itemID)
        .then(item => res.render("pages/item.njk", { item }))
        .catch(err => res.render("pages/item.njk", { err  }))
)

routes.get(
    "/db_info",
    (req, res) => DBInfo.get()
        .then(dbInfo => res.render("pages/db_info.njk", { dbInfo }))
        .catch(err => res.render("pages/db_info.njk", { err }))
)

routes.get("/about", (req, res) => res.render("pages/about.njk"))

routes.get("/login", (req, res) => res.render("pages/login.njk"))

routes.get("/control_panel", (req, res) => res.render("pages/control_panel.njk"))

export default routes