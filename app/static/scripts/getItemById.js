const getItemByIdForm = document.querySelector("#get-item-by-id")
getItemByIdForm.addEventListener(
    "submit",
    event => {
        event.preventDefault()
        const formData = new FormData(getItemByIdForm)
        const itemID   = formData.get("itemID")
        window.location.assign(`/app/item/${itemID}`)
    }
)