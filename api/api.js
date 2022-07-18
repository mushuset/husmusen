import { Router } from "express"
import api_1_0_0 from "./1.0.0/1.0.0.js"
import authApi from "./auth.js"
import dbInfoApi from "./db_info.js"
import rateLimit from "express-rate-limit"

const api = Router()
const authRateLimit = rateLimit({
    windowMs: 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
})

api.use("/1.0.0", api_1_0_0)
api.use("/auth", authRateLimit, authApi)
api.use("/db_info", dbInfoApi)

export default api