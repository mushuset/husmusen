import { Router } from "express"
import fileApi from "./file.js"
import itemApi from "./item.js"
import keywordApi from "./keywords.js"
import logApi from "./log.js"

const api = Router()

// Mount all the different APIs...
api.use("/file",    fileApi)
api.use("/item",    itemApi)
api.use("/log",     logApi)
api.use("/keyword", keywordApi)

export default api