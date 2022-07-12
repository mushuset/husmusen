import { Router } from "express"
import api_1_0_0 from "./1.0.0/1.0.0.js"
import authApi from "./auth.js"
import dbInfoApi from "./db_info.js"

const api = Router()

api.use("/1.0.0", api_1_0_0)
api.use("/auth", authApi)
api.use("/db_info", dbInfoApi)

export default api