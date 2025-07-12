const express = require("express");
const router = express.Router();
const Country = require("../tables/country");
const country = new Country();
const User = require("../tables/user");
const user = new User();
const { suglify } = require('../middlewares/suglify');
const Image = require("../tables/image");
const image = new Image();

router.get("/all", async (req, resp) => {
    try {
        let countries = await country.query("SELECT country.id, country.name, country.slug, country.date, image.file_path as image FROM country INNER JOIN image ON country.image = image.id ORDER BY country.id DESC");
        return resp.send(countries);
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
            if (await country.existsBySlug(slug)) {
                slug += "-" + (new Date())
                slug = suglify(slug);
            }
            const country1 = await country.create({ name, image, slug });
            return resp.send({ status: true, message: "country Added" });
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
            const country1 = await country.delete({ id });
            return resp.send({ status: true, message: "country Deleted" });
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
                await country.update({ name: name, image: image }, { id: id });
            } else {
                const country1 = await country.update({ name: name }, { id: id });
            }
            return resp.send({ status: true, message: "country Updated" });
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in add route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
})

module.exports = router;
