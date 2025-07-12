const express = require('express');
const router = express.Router();
const Blog = require('../tables/blog');
const User = require('../tables/user');
const Image = require('../tables/image');
const Category = require('../tables/blog-category');
const Tag = require('../tables/blog-tag');
const categoryTable = new Category();
const tagTable = new Tag();
const image = new Image();

const blog = new Blog();
const user = new User();

// Helper function to generate and validate slugs
const generateSlug = (text) => {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')        // Replace spaces with -
        .replace(/&/g, '-and-')      // Replace & with 'and'
        .replace(/[^\w\-]+/g, '')    // Remove all non-word characters
        .replace(/\-\-+/g, '-');     // Replace multiple - with single -
};

// Get all blogs (with optional filtering)
router.get("/all", async (req, resp) => {
    try {
        const blogs = await blog.findAll();

        // If no blogs found, return empty array
        if (!blogs || blogs.length === 0) {
            return resp.send([]);
        }

        // Format the response data
        const formattedBlogs = await Promise.all(blogs.map(async item => {
            try {
                // Parse category and tags safely
                let categoryData = [];
                let tagsData = [];
                
                // Safe JSON parsing for categories
                try {
                    let categoryIds = item.category ? JSON.parse(item.category) : [];
                    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                        categoryData = await Promise.all(categoryIds.map(async (catId) => {
                            try {
                                // Validate category ID - skip null, undefined, empty string, or 'null' string
                                if (!catId || catId === 'null' || catId === null || catId === undefined) {
                                    return '';
                                }
                                const category = await categoryTable.findById(catId);
                                return category ? category.name : '';
                            } catch (err) {
                                console.log(`Error finding category ${catId}:`, err);
                                return '';
                            }
                        }));
                        categoryData = categoryData.filter(cat => cat !== '');
                    }
                } catch (err) {
                    console.log('Error parsing categories:', err);
                    categoryData = [];
                }

                // Safe JSON parsing for tags
                try {
                    let tagsIds = item.tags ? JSON.parse(item.tags) : [];
                    if (Array.isArray(tagsIds) && tagsIds.length > 0) {
                        tagsData = await Promise.all(tagsIds.map(async (tagId) => {
                            try {
                                // Validate tag ID - skip null, undefined, empty string, or 'null' string
                                if (!tagId || tagId === 'null' || tagId === null || tagId === undefined) {
                                    return '';
                                }
                                const tag = await tagTable.findById(tagId);
                                return tag ? tag.name : '';
                            } catch (err) {
                                console.log(`Error finding tag ${tagId}:`, err);
                                return '';
                            }
                        }));
                        tagsData = tagsData.filter(tag => tag !== '');
                    }
                } catch (err) {
                    console.log('Error parsing tags:', err);
                    tagsData = [];
                }

                // Safe image lookup
                let img = '';
                try {
                    if (item.featured_image) {
                        const imageData = await image.findById(item.featured_image);
                        img = imageData ? imageData.file_path : '';
                    }
                } catch (err) {
                    console.log(`Error finding image ${item.featured_image}:`, err);
                    img = '';
                }

                // Safe author lookup
                let author_name = '';
                try {
                    if (item.author) {
                        const authorData = await user.findByEmail(item.author);
                        author_name = authorData ? authorData.name : '';
                    }
                } catch (err) {
                    console.log(`Error finding author ${item.author}:`, err);
                    author_name = '';
                }

                let sendData = {
                    id: item.id,
                    title: item.title || '',
                    slug: item.slug || '',
                    image: img,
                    category: categoryData,
                    content: item.content || '',
                    tags: tagsData,
                    author: item.author || '',
                    author_name: author_name,
                    status: item.status || 'draft',
                    meta: {
                        title: item.meta_title || '',
                        tags: item.meta_tags || '',
                        extra: item.extra_meta_tags || ''
                    },
                    last_modified: item.updated_at,
                    date: item.created_at
                };
                return sendData;
            } catch (itemError) {
                console.log(`Error processing blog item ${item.id}:`, itemError);
                // Return a minimal valid object for this blog item
                return {
                    id: item.id,
                    title: item.title || 'Untitled',
                    slug: item.slug || '',
                    image: '',
                    category: [],
                    content: item.content || '',
                    tags: [],
                    author: item.author || '',
                    author_name: '',
                    status: item.status || 'draft',
                    meta: { title: '', tags: '', extra: '' },
                    last_modified: item.updated_at,
                    date: item.created_at
                };
            }
        }));

        return resp.send(formattedBlogs);
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error", error: error.message });
    }
});

// Get a single blog by ID
router.get("/:id", async (req, resp) => {
    const { id } = req.params;

    try {
        const blogs = await blog.findAllWhere({ id: id });

        // Format the response data
        const formattedBlogs = await Promise.all(blogs.map(async item => {
            try {
                // Parse category and tags safely
                let categoryData = [];
                let tagsData = [];
                
                // Safe JSON parsing for categories
                try {
                    let categoryIds = item.category ? JSON.parse(item.category) : [];
                    if (Array.isArray(categoryIds) && categoryIds.length > 0) {
                        categoryData = await Promise.all(categoryIds.map(async (catId) => {
                            try {
                                // Validate category ID - skip null, undefined, empty string, or 'null' string
                                if (!catId || catId === 'null' || catId === null || catId === undefined) {
                                    return '';
                                }
                                const category = await categoryTable.findById(catId);
                                return category ? category.name : '';
                            } catch (err) {
                                console.log(`Error finding category ${catId}:`, err);
                                return '';
                            }
                        }));
                        categoryData = categoryData.filter(cat => cat !== '');
                    }
                } catch (err) {
                    console.log('Error parsing categories:', err);
                    categoryData = [];
                }

                // Safe JSON parsing for tags
                try {
                    let tagsIds = item.tags ? JSON.parse(item.tags) : [];
                    if (Array.isArray(tagsIds) && tagsIds.length > 0) {
                        tagsData = await Promise.all(tagsIds.map(async (tagId) => {
                            try {
                                // Validate tag ID - skip null, undefined, empty string, or 'null' string
                                if (!tagId || tagId === 'null' || tagId === null || tagId === undefined) {
                                    return '';
                                }
                                const tag = await tagTable.findById(tagId);
                                return tag ? tag.name : '';
                            } catch (err) {
                                console.log(`Error finding tag ${tagId}:`, err);
                                return '';
                            }
                        }));
                        tagsData = tagsData.filter(tag => tag !== '');
                    }
                } catch (err) {
                    console.log('Error parsing tags:', err);
                    tagsData = [];
                }

                // Safe image lookup
                let img = '';
                try {
                    if (item.featured_image) {
                        const imageData = await image.findById(item.featured_image);
                        img = imageData ? imageData.file_path : '';
                    }
                } catch (err) {
                    console.log(`Error finding image ${item.featured_image}:`, err);
                    img = '';
                }

                let sendData = {
                    id: item.id,
                    title: item.title || '',
                    slug: item.slug || '',
                    content: item.content || '',
                    image: img,
                    category: categoryData,
                    tags: tagsData,
                    author: item.author || '',
                    status: item.status || 'draft',
                    meta: {
                        title: item.meta_title || '',
                        tags: item.meta_tags || '',
                        extra: item.extra_meta_tags || ''
                    },
                    last_modified: item.updated_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                };
                return sendData;
            } catch (itemError) {
                console.log(`Error processing blog item ${item.id}:`, itemError);
                // Return a minimal valid object for this blog item
                return {
                    id: item.id,
                    title: item.title || 'Untitled',
                    slug: item.slug || '',
                    image: '',
                    category: [],
                    content: item.content || '',
                    tags: [],
                    author: item.author || '',
                    status: item.status || 'draft',
                    meta: { title: '', tags: '', extra: '' },
                    last_modified: item.updated_at,
                    created_at: item.created_at,
                    updated_at: item.updated_at
                };
            }
        }));

        return resp.send(formattedBlogs[0]);
    } catch (error) {
        console.log(`Error fetching blog ${id}:`, error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Create a new blog
router.post("/create", async (req, resp) => {
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        let { title, slug, content, category, tags, status, author, meta } = req.body;

        category = JSON.parse(category);
        tags = JSON.parse(tags);

        // Validate required fields
        if (!title || !content) {
            return resp.status(400).send({
                status: false,
                message: "Title and content are required"
            });
        }

        // Generate and validate slug if not provided
        let validatedSlug = slug ? generateSlug(slug) : generateSlug(title);

        // Check if slug already exists
        if (await blog.exists({ slug: validatedSlug })) {
            validatedSlug += "-" + parseInt(Math.random() * 100000);
        }

        // Handle image uploads if present
        let featuredImage = '';

        if (req.files && req.files.image) {
            const file = req.files.image;
            let images = await image.convertAndUpload(file, "blogs");
            if (images) {
                featuredImage = images.insertId;
            }
        }

        // Validate category and tags
        if (!Array.isArray(category) || !Array.isArray(tags)) {
            return resp.status(400).send({
                status: false,
                message: "Category and tags must be arrays"
            });
        }

        // Handle categories safely
        let categories = [];
        if (category.length && category.length > 0) {
            for (let i = 0; i < category.length; i++) {
                try {
                    const categoryName = category[i].trim();
                    if (!categoryName) continue;

                    // Check if category exists by name first
                    const existingCategory = await categoryTable.findByName(categoryName);
                    if (existingCategory) {
                        categories.push(existingCategory.id);
                    } else {
                        // Create new category with unique slug
                        let categorySlug = generateSlug(categoryName);
                        
                        // Ensure slug is unique
                        let counter = 1;
                        while (await categoryTable.exists({ slug: categorySlug })) {
                            categorySlug = generateSlug(categoryName) + '-' + counter;
                            counter++;
                        }
                        
                        const newCategory = await categoryTable.create({ 
                            name: categoryName, 
                            slug: categorySlug 
                        });
                        categories.push(newCategory.insertId);
                    }
                } catch (err) {
                    console.log(`Error processing category ${category[i]}:`, err);
                    // Skip this category and continue
                }
            }
        }
        
        // If no categories were processed, add default category
        if (categories.length === 0) {
            categories = ['1'];
        }

        // Handle tags safely
        let newTags = [];
        for (let i = 0; i < tags.length; i++) {
            try {
                const tagName = tags[i].trim();
                if (!tagName) continue;

                // Sanitize tag name to prevent SQL injection
                const sanitizedTagName = tagName.replace(/'/g, "''");
                
                // Check if tag exists by name
                const existingTag = await tagTable.findByName(sanitizedTagName);
                if (existingTag) {
                    newTags.push(existingTag.id);
                } else {
                    // Create new tag with unique slug
                    let tagSlug = generateSlug(tagName);
                    
                    // Ensure slug is unique
                    let counter = 1;
                    while (await tagTable.exists({ slug: tagSlug })) {
                        tagSlug = generateSlug(tagName) + '-' + counter;
                        counter++;
                    }
                    
                    const newTag = await tagTable.create({ 
                        name: sanitizedTagName, 
                        slug: tagSlug 
                    });
                    newTags.push(newTag.insertId);
                }
            } catch (err) {
                console.log(`Error processing tag ${tags[i]}:`, err);
                // Skip this tag and continue
            }
        }

        // Create blog data
        const blogData = {
            title,
            slug: validatedSlug,
            content,
            featured_image: featuredImage,
            category: JSON.stringify(categories),
            tags: JSON.stringify(newTags),
            status: status || 'draft',
            author: author || '',
            meta: meta || '{}'
        };

        const result = await blog.create(blogData);

        return resp.send({
            status: true,
            message: "Blog created successfully",
            id: result.insertId
        });
    } catch (error) {
        console.log("Error creating blog:", error);
        
        // Provide more specific error messages
        let errorMessage = "Internal Server Error";
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = "A blog with this title or slug already exists";
        } else if (error.code === 'ER_PARSE_ERROR') {
            errorMessage = "Invalid data format provided";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return resp.status(500).send({ 
            status: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Update an existing blog
router.post("/update/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        // Check if blog exists
        if (!(await blog.exists({ id }))) {
            return resp.status(404).send({ status: false, message: "Blog not found" });
        }

        const blogFull = await blog.findById(id);

        let finalData = {};

        let { title, slug, content, category, tags, status, author, meta } = req.body;
        if (title && (blogFull.title != title)) finalData.title = title;
        if (slug && (blogFull.slug != slug)) finalData.slug = slug;
        if (content && (blogFull.content != content)) finalData.content = content;
        if (status && (blogFull.status != status)) finalData.status = status;
        if (author && (blogFull.author != author)) finalData.author = author;
        if (meta && (blogFull.meta != meta)) finalData.meta = meta;

        if (category) {
            let categories = [];
            category = JSON.parse(category);
            if (category.length && category.length > 0) {
                for (let i = 0; i < category.length; i++) {
                    try {
                        const categoryName = category[i].trim();
                        if (!categoryName) continue;

                        // Check if category exists by name first
                        const existingCategory = await categoryTable.findByName(categoryName);
                        if (existingCategory) {
                            categories.push(existingCategory.id);
                        } else {
                            // Create new category with unique slug
                            let categorySlug = generateSlug(categoryName);
                            
                            // Ensure slug is unique
                            let counter = 1;
                            while (await categoryTable.exists({ slug: categorySlug })) {
                                categorySlug = generateSlug(categoryName) + '-' + counter;
                                counter++;
                            }
                            
                            const newCategory = await categoryTable.create({ 
                                name: categoryName, 
                                slug: categorySlug 
                            });
                            categories.push(newCategory.insertId);
                        }
                    } catch (err) {
                        console.log(`Error processing category ${category[i]}:`, err);
                        // Skip this category and continue
                    }
                }
                
                // If no categories were processed, add default category
                if (categories.length === 0) {
                    categories = ['1'];
                }
                
                if (JSON.stringify(categories) !== blogFull.category) {
                    finalData.category = JSON.stringify(categories);
                }
            } else {
                categories = ['1'];
                finalData.category = JSON.stringify(categories);
            }
        }

        if (tags) {
            let newTags = [];
            tags = JSON.parse(tags);
            for (let i = 0; i < tags.length; i++) {
                try {
                    const tagName = tags[i].trim();
                    if (!tagName) continue;

                    // Sanitize tag name to prevent SQL injection
                    const sanitizedTagName = tagName.replace(/'/g, "''");
                    
                    // Check if tag exists by name
                    const existingTag = await tagTable.findByName(sanitizedTagName);
                    if (existingTag) {
                        newTags.push(existingTag.id);
                    } else {
                        // Create new tag with unique slug
                        let tagSlug = generateSlug(tagName);
                        
                        // Ensure slug is unique
                        let counter = 1;
                        while (await tagTable.exists({ slug: tagSlug })) {
                            tagSlug = generateSlug(tagName) + '-' + counter;
                            counter++;
                        }
                        
                        const newTag = await tagTable.create({ 
                            name: sanitizedTagName, 
                            slug: tagSlug 
                        });
                        newTags.push(newTag.insertId);
                    }
                } catch (err) {
                    console.log(`Error processing tag ${tags[i]}:`, err);
                    // Skip this tag and continue
                }
            }
            
            if (JSON.stringify(newTags) !== blogFull.tags) {
                finalData.tags = JSON.stringify(newTags);
            }
        }

        if (req.files && req.files.image) {
            let images = await image.convertAndUpload(req.files.image, "blogs");
            if (images) {
                finalData.featured_image = images.insertId;
            }
        }

        if (slug && (slug !== blogFull.slug)) finalData.slug = slug;

        if (Object.keys(finalData).length === 0) {
            return resp.status(400).send({ status: false, message: "No fields to update" });
        } else {
            await blog.update(finalData, { id });
            return resp.send({ status: true, message: "Blog updated successfully" });
        }
    } catch (error) {
        console.log(`Error updating blog ${id}:`, error);
        
        // Provide more specific error messages
        let errorMessage = "Internal Server Error";
        if (error.code === 'ER_DUP_ENTRY') {
            errorMessage = "A blog with this title or slug already exists";
        } else if (error.code === 'ER_PARSE_ERROR') {
            errorMessage = "Invalid data format provided";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        return resp.status(500).send({ 
            status: false, 
            message: errorMessage,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Delete a blog
router.post("/delete/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (!isAdmin) {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }

        // Check if blog exists
        if (!(await blog.exists({ id }))) {
            return resp.status(404).send({ status: false, message: "Blog not found" });
        }

        await blog.delete({ id });

        return resp.send({ status: true, message: "Blog deleted successfully" });
    } catch (error) {
        console.log(`Error deleting blog ${id}:`, error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

module.exports = router;
