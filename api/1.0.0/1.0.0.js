import { Router } from "express"
import fileApi from "./file.js"
import itemApi from "./item.js"
import logApi from "./log.js"

const api = Router()

api.use("/file", fileApi)
api.use("/item", itemApi)
api.use("/log",  logApi)

export default api