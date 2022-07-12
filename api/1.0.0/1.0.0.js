import { Router } from "express"
import fileApi from "./file.js"
import itemApi from "./item.js"

const api = Router()

api.use("/file", fileApi)
api.use("/item", itemApi)

export default api