import { Router } from "express"

const fileApi = Router()

// NOTHING IMPLEMENTED HERE YET!

fileApi.get("/get/:id", (req, res) => res.sendit(req.originalUrl))
fileApi.get("/info/:id", (req, res) => res.sendit(req.originalUrl))

fileApi.post("/new", (req, res) => res.sendit(req.originalUrl))
fileApi.post("/edit/:id", (req, res) => res.sendit(req.originalUrl))
fileApi.post("/delete/:id", (req, res) => res.sendit(req.originalUrl))

export default fileApi