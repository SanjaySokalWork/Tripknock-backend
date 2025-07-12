const express = require("express");
const router = express.Router();
const User = require("../tables/user");
const user = new User();
const BlogTag = require("../tables/blog-tag");
const blogTag = new BlogTag();

// Get all tags
router.get("/all", async (req, resp) => {
    try {
        let tags = await blogTag.findAll();
        tags = await Promise.all(tags.map(async tag => ({
            ...tag,
            blogCount: await blogTag.countByTag(tag.id)
        })));
        return resp.send(tags);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get a single tag by ID
router.get("/:id", async (req, resp) => {
    const { id } = req.params;

    try {
        const tag = await blogTag.findById(id);
        if (!tag) {
            return resp.status(404).send({ status: false, message: "Tag not found" });
        }

        return resp.send(tag);
    } catch (error) {
        console.log("Error in /:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Create a new tag
router.post("/create", async (req, resp) => {
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const { name, slug } = req.body;

        // Validate required fields
        if (!name || !slug) {
            return resp.status(400).send({ status: false, message: "Name and slug are required" });
        }

        if (!(await user.isRole(admin, ["admin", "superadmin"]))) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        // Check if slug already exists
        const slugExists = await blogTag.exists({ slug });
        if (slugExists) {
            return resp.status(400).send({ status: false, message: "Slug already exists" });
        }

        // Create the tag
        const tagData = {
            name,
            slug
        };

        const result = await blogTag.create(tagData);
        return resp.status(201).send({ status: true, message: "Tag created successfully", id: result.id });
    } catch (error) {
        console.log("Error in /create route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Update a tag
router.post("/update/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        // Check if the tag exists
        const tag = await blogTag.findById(id);
        if (!tag) {
            return resp.status(404).send({ status: false, message: "Tag not found" });
        }

        if (!(await user.isRole(admin, ["admin", "superadmin"]))) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        const { name, slug } = req.body;

        // Validate required fields
        if (!name || !slug) {
            return resp.status(400).send({ status: false, message: "Name and slug are required" });
        }

        // Check if slug already exists (excluding current tag)
        const slugExists = await blogTag.findAllWhere({ slug });
        if (slugExists.length > 0 && slugExists[0].id != id) {
            return resp.status(400).send({ status: false, message: "Slug already exists" });
        }

        // Update the tag
        const tagData = {
            name,
            slug
        };

        await blogTag.update(tagData, { id: id });
        return resp.send({ status: true, message: "Tag updated successfully" });
    } catch (error) {
        console.log("Error in /update/:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Delete a tag
router.delete("/delete/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        if (!(await user.isRole(admin, ["admin", "superadmin"]))) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        // Check if the tag exists
        const tag = await blogTag.findById(id);
        if (!tag) {
            return resp.status(404).send({ status: false, message: "Tag not found" });
        }

        // Delete the tag
        await blogTag.delete({ id });
        return resp.send({ status: true, message: "Tag deleted successfully" });
    } catch (error) {
        console.log("Error in /delete/:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

module.exports = router;
