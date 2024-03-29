import { Router } from "express"
import rateLimit from "express-rate-limit"
import api_1_0_0 from "./1.0.0/1.0.0.js"
import authApi from "./auth.js"
import dbInfoApi from "./db_info.js"

const api = Router()

// Crete a rate limit for auth API...
const authRateLimit = rateLimit({
    windowMs: 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false
})

// Mount all the routes...
api.use("/1.0.0", api_1_0_0)
api.use("/auth", authRateLimit, authApi)
api.use("/db_info", dbInfoApi)

export default api