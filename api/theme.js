const express = require("express");
const router = express.Router();
const Theme = require("../tables/theme");
const theme = new Theme();
const User = require("../tables/user");
const user = new User();
const { suglify } = require('../middlewares/suglify');
const Image = require("../tables/image");
const image = new Image();

router.get("/all", async (req, resp) => {
    try {
        let themes = await theme.query("SELECT theme.id, theme.name, theme.slug, theme.date, image.file_path as image FROM theme INNER JOIN image ON theme.image = image.id ORDER BY theme.id DESC")
        return resp.send(themes);
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
            if (await theme.existsBySlug(slug)) {
                slug += "-" + (new Date())
                slug = suglify(slug);
            }
            const theme1 = await theme.create({ name, image, slug });
            return resp.send({ status: true, message: "theme Added" });
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
            const theme1 = await theme.delete({ id });
            return resp.send({ status: true, message: "theme Deleted" });
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
                await theme.update({ name: name, image: image }, { id: id });
            } else {
                const theme1 = await theme.update({ name: name }, { id: id });
            }
            return resp.send({ status: true, message: "theme Updated" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in add route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

module.exports = router;
