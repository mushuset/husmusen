import checkSuccess from "./checkSuccess.js"

const searchParams = (new URL(window.location)).searchParams

const types       = searchParams.getAll("types").join(",") || null
const freetext    = searchParams.get("freetext")           || null
const keywords    = searchParams.get("keywords")           || null
const keywordMode = searchParams.get("keyword_mode")       || null
const sort        = searchParams.get("sort")               || null
const reverse     = searchParams.get("reverse")            || null

// Clean up the url if there are multiple `types=TYPE`, e.g. `types=Book&types=Document` or if there are empty queries.
// This would turn `/app/search?freetext=&sort=name&types=Book&types=Document&` into `/app/search?types=Book,Document&sort=name`.
if (searchParams.getAll("types").length > 1 || window.location.search.match(/((?<=[\?&])\w+=&|&$)/))
    window.location.replace(`?${types ? `types=${types}&` : ""}${freetext ? `freetext=${freetext}&` : ""}${keywords ? `keywords=${keywords}&` : ""}${keywordMode ? `keyword_mode=${keywordMode}&` : ""}${sort ? `sort=${sort}&` : ""}${reverse ? `reverse=${reverse}&` : ""}`.replace(/&$/m, ""))

fetch(`/api/1.0.0/item/search${window.location.search}`, { method: "GET" })
    // Handle the response.
    .then(checkSuccess)
    // Handle the response data.
    .then(
        data => {
            // This turns all the search results into HTML.
            const htmlFromData = data
                .map(
                    item => `
                        <div class="item">
                            <h1>${item.name}</h1>
                            <p>${item.description}</p>
                            <p>Inventarienummer: ${item.itemID}</p>
                            <p>Typ: ${item.type}</p>
                            <p>Nyckelord: <span class="keyword">${item.keywords.split(",").join("</span><span class=\"keyword\">")}</span></p>
                            <p>Tillagd: ${(new Date(item.addedAt)).toLocaleString("sv-SE")}</p>
                            <p>Uppdaterad: ${(new Date(item.updatedAt)).toLocaleString("sv-SE")}</p>
                            <a href="/app/item#${item.itemID}">Läs mer...</a>
                        </div>
                    `
                )
                .join("")

            // Now we render said HTML into the document.
            document.querySelector("#search-results").innerHTML = htmlFromData
        }
    )
    // Catch errors.
    .catch(
        err => {
            alert("Error! Kolla i konsolen för mer information.")
            console.error(err)
        }
    )