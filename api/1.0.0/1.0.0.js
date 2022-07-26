import { Router } from "express"
import fileApi from "./file.js"
import itemApi from "./item.js"
import logApi from "./log.js"
import keywordApi from "./keywords.js"

const api = Router()

api.use("/file",    fileApi)
api.use("/item",    itemApi)
api.use("/log",     logApi)
api.use("/keyword", keywordApi)

export default api