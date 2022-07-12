import { Router } from "express"

const itemApi = Router()

itemApi.get("/search", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/info/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/keywords", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/keywords/:type", (req, res) => res.sendit(req.originalUrl))

itemApi.post("/new", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/edit/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/mark/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/delete/:id", (req, res) => res.sendit(req.originalUrl))

export default itemApi