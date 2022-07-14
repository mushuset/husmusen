import { Router } from "express"
import Item from "../../models/Item.js"

const itemApi = Router()

itemApi.get("/search", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/info/:id", (req, res) => {
    const itemID = req.params.id

    Item.get(itemID)
        .then(item => res.sendit(item))
        .catch(err => {
            if (err === "NO_EXISTS")
                return res.status(404).send(`There exists no item with ItemID '${itemID}'!`)

            res.status(500).send(`There was an error while getting item with ItemID '${itemID}'!`)
            console.error(err)
        })
})
itemApi.get("/keywords", (req, res) => res.sendit(req.originalUrl))
itemApi.get("/keywords/:type", (req, res) => res.sendit(req.originalUrl))

itemApi.post("/new", (req, res) => {
    const {
        name,
        description,
        keywords,
        type,
        itemID,
        itemData,
        customData
    } = req.data

    const itemRequest = Item.create(
        name,
        description,
        keywords,
        type,
        itemID,
        itemData,
        customData
    )

    if (itemRequest.status === "ERR")
        return res.status(500).send(itemRequest.data)

    const item = itemRequest.data

    Item.save(item)
        .then(item => res.sendit(item))
        .catch(err => {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(500).send(`The itemID '${itemID}' is already taken!`)
            res.status(500).send("Error while saving the item!")
            console.error(err)
        })
})
itemApi.post("/edit/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/mark/:id", (req, res) => res.sendit(req.originalUrl))
itemApi.post("/delete/:id", (req, res) => res.sendit(req.originalUrl))

export default itemApi