const express = require("express");
const router = express.Router();
const Season = require("../tables/season");
const season = new Season();
const User = require("../tables/user");
const user = new User();
const { suglify } = require('../middlewares/suglify');
const Image = require("../tables/image");
const image = new Image();

router.get("/all", async (req, resp) => {
    try {
        let seasons = await season.query("SELECT season.id, season.name, season.slug, season.date, image.file_path as image FROM season INNER JOIN image ON season.image = image.id ORDER BY season.id DESC");
        return resp.send(seasons);
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
            let slug = suglify(name)
            if (await season.existsBySlug(slug)) {
                slug += "-" + (new Date())
                slug = suglify(slug);
            }
            const season1 = await season.create({ name, image, slug });
            return resp.send({ status: true, message: "Season Added" });
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
            const season1 = await season.delete({ id });
            return resp.send({ status: true, message: "Season Deleted" });
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
                await season.update({ name: name, image: image }, { id: id });
            } else {
                const season1 = await season.update({ name: name }, { id: id });
            }
            return resp.send({ status: true, message: "Season Updated" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in update route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

module.exports = router;
