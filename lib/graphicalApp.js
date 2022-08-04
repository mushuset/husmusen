import rateLimit from "express-rate-limit"
import njk from "nunjucks"
import url2njk from "./url2njk.js"


// The app heavily uses filesystem, so rate limit it.
// TODO: It isn't too hard to make a proper fix for this and make one route per page, instead of
// this `url2njk`-thing. It should be done, considering it is *easy*.
// UPDATE: More and more pages have been/will be added... :/
const appRateLimiter = rateLimit({
    windowMs: 5000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false
})

export default function setupGraphicalApp(express) {
    njk.configure(
        "app",
        {
            autoescape: true,
            express,
            lstripBlocks: true,
            trimBlocks: true,
        }
    )

    express.get('/app',   appRateLimiter, url2njk)
    express.get('/app/*', appRateLimiter, url2njk)
    express.get("/", (req, res) => res.redirect("/app"))
}