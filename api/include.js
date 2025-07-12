const express = require("express");
const router = express.Router();
const Include = require("../tables/include");
const include = new Include();
const User = require("../tables/user");
const user = new User();
const Image = require("../tables/image");
const image = new Image();

router.get("/all", async (req, resp) => {
    try {
        let includes = await include.query("SELECT include.id, include.name, include.date, image.file_path as image FROM include INNER JOIN image ON include.image = image.id ORDER BY include.id DESC");
        return resp.send(includes);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

router.post("/create", async (req, resp) => {
    const { name } = req.body;
    const { image } = req.files;
    const { admin } = req.headers;
    if (!name || !image) {
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const include1 = await include.create({ name, image });
            return resp.send({ status: true, message: "Include Added" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in add route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post('/delete', async (req, resp) => {
    const { id } = req.body;
    const { admin } = req.headers;
    if (!id) {
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const include1 = await include.delete({ id });
            return resp.send({ status: true, message: "Include Deleted" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in add route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

router.post('/update', async (req, resp) => {
    const { id, name } = req.body;
    let image = null;
    if (req.files) {
        image = req.files.image;
    }
    const { admin } = req.headers;
    if (!id) {
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            if (image) {
                await include.update({ name: name, image: image }, { id: id });
            } else {
                const include1 = await include.update({ name: name }, { id: id });
            }
            return resp.send({ status: true, message: "Include Updated" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in add route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

module.exports = router;
