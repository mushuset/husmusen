
import { Router } from "express"

const api = Router()

api.get("/", (req, res) => res.send("Hello world!"))

export default api