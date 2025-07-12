const express = require("express");
const router = express.Router();
const User = require("../tables/user");
const user = new User();
const BlogCategory = require("../tables/blog-category");
const blogCategory = new BlogCategory();
const Blog = require("../tables/blog");
const blog = new Blog();

// Get all categories
router.get("/all", async (req, resp) => {
    try {
        let categories = await blogCategory.findAll();
        categories = await Promise.all(categories.map(async category => ({
            ...category,
            blogCount: await blog.countByCategory(category.id)
        })));
        return resp.send(categories);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get a single category by ID
router.get("/:id", async (req, resp) => {
    const { id } = req.params;

    try {
        const category = await blogCategory.findById(id);
        if (!category) {
            return resp.status(404).send({ status: false, message: "Category not found" });
        }

        return resp.send(category);
    } catch (error) {
        console.log("Error in /:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Create a new category
router.post("/create", async (req, resp) => {
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const { name, slug } = req.body;

        // Validate required fields
        if (!name || !slug) {
            return resp.status(400).send({ status: false, message: "Name and slug are required" });
        }

        // Check if slug already exists
        const slugExists = await blogCategory.exists({ slug });
        if (slugExists) {
            return resp.status(400).send({ status: false, message: "Slug already exists" });
        }

        // Create the category
        const categoryData = {
            name,
            slug
        };

        const result = await blogCategory.create(categoryData);
        return resp.status(201).send({ status: true, message: "Category created successfully", id: result.id });
    } catch (error) {
        console.log("Error in /create route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Update a category
router.put("/update/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const { name, slug } = req.body;

        // Validate required fields
        if (!name || !slug) {
            return resp.status(400).send({ status: false, message: "Name and slug are required" });
        }

        // Check if the category exists
        const category = await blogCategory.findById(id);
        if (!category) {
            return resp.status(404).send({ status: false, message: "Category not found" });
        }

        // Check if the new slug already exists (except for the current category)
        if (slug !== category.slug) {
            const slugExists = await blogCategory.exists({ slug });
            if (slugExists) {
                return resp.status(400).send({ status: false, message: "Slug already exists" });
            }
        }

        // Update the category
        const categoryData = {
            name,
            slug
        };

        await blogCategory.update(categoryData, { id });
        return resp.send({ status: true, message: "Category updated successfully" });
    } catch (error) {
        console.log("Error in /update/:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Delete a category
router.delete("/delete/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        // Check if the category exists
        const category = await blogCategory.findById(id);
        if (!category) {
            return resp.status(404).send({ status: false, message: "Category not found" });
        }

        // Delete the category
        await blogCategory.delete({ id });
        return resp.send({ status: true, message: "Category deleted successfully" });
    } catch (error) {
        console.log("Error in /delete/:id route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

module.exports = router;
