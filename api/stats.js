const express = require("express");
const router = express.Router();
const Destination = require("../tables/destination");
const destination = new Destination();
const Package = require("../tables/package");
const package = new Package();
const Blog = require("../tables/blog");
const blog = new Blog();
const User = require("../tables/user");
const user = new User();
const Review = require("../tables/reviews");
const review = new Review();

// Get dashboard statistics
router.get("/dashboard", async (req, resp) => {
    try {
        const stats = {
            destinations: {
                total: 0,
                published: 0,
                draft: 0
            },
            tours: {
                total: 0,
                published: 0,
                draft: 0
            },
            blogs: {
                total: 0,
                published: 0,
                draft: 0
            },
            users: {
                total: 0
            },
            reviews: {
                total: 0
            }
        };

        // Get destination stats
        const destinations = await destination.findAll();
        if (destinations && destinations.length > 0) {
            stats.destinations.total = destinations.length;
            stats.destinations.published = destinations.filter(item => item.status === 'published').length;
            stats.destinations.draft = destinations.filter(item => item.status === 'draft').length;
        }

        // Get tour/package stats
        const tours = await package.findAll();
        if (tours && tours.length > 0) {
            stats.tours.total = tours.length;
            stats.tours.published = tours.filter(item => item.status === 'published').length;
            stats.tours.draft = tours.filter(item => item.status === 'draft').length;
        }

        // Get blog stats
        const blogs = await blog.findAll();
        if (blogs && blogs.length > 0) {
            stats.blogs.total = blogs.length;
            stats.blogs.published = blogs.filter(item => item.status === 'published').length;
            stats.blogs.draft = blogs.filter(item => item.status === 'draft').length;
        }

        // Get user stats
        const users = await user.findAll();
        if (users && users.length > 0) {
            stats.users.total = users.length;
        }

        // Get review stats
        const reviews = await review.findAll();
        if (reviews && reviews.length > 0) {
            stats.reviews.total = reviews.length;
        }

        return resp.status(200).json(stats);
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        return resp.status(500).json({ status: false, message: "Internal Server Error" });
    }
});

module.exports = router;
