import { Router } from "express"
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
routes.get("/login", (req, res) => res.render("pages/login.njk"))
routes.get("/control_panel", (req, res) => res.render("pages/control_panel.njk"))
routes.get("/about", (req, res) => res.render("pages/about.njk"))

export default routes