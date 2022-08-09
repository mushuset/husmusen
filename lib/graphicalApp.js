import express from "express"
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

/**
 * This function sets up the graphical UI.
 * @param {Express.Application} expressApp
 */
export default function setupGraphicalApp(expressApp) {
    njk.configure(
        "app/views",
        {
            autoescape: true,
            express: expressApp,
            lstripBlocks: true,
            trimBlocks: true,
        }
    )

    // Set up all routes.
    expressApp.get("/app",        appRateLimiter, url2njk)
    expressApp.get("/app/*",      appRateLimiter, url2njk)
    expressApp.use("/static",     express.static("app/static"))

    // Redirect / to /app by default.
    expressApp.get("/", (req, res) => res.redirect("/app"))
}