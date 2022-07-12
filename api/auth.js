import { Router } from "express"

const authApi = Router()

authApi.post("/login", (req, res) => res.send("UNIMPLEMENTED!"))
authApi.post("/new", (req, res) => res.send("UNIMPLEMENTED!"))
authApi.post("/delete/:user", (req, res) => res.send("UNIMPLEMENTED!"))

export default authApi