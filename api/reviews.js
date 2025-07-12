const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const User = require("../tables/user");
const user = new User();
const Reviews = require("../tables/reviews");
const reviews = new Reviews();
const Image = require("../tables/image");
const image = new Image();
const uuidv4 = require('uuid').v4;

// Middleware to serve static files
router.use('/images', express.static(path.join(__dirname, '../uploads/reviews/images')));
router.use('/videos', express.static(path.join(__dirname, '../uploads/reviews/videos')));

// Helper function to safely parse review_images JSON
function parseReviewImages(reviewImages) {
    if (!reviewImages) return [];
    
    try {
        // Check if it's already an object/array
        if (typeof reviewImages === 'string') {
            return JSON.parse(reviewImages);
        } else if (Array.isArray(reviewImages)) {
            return reviewImages;
        }
        return [];
    } catch (e) {
        console.log('Error parsing review_images:', e);
        return [];
    }
}

// Get all reviews (for admin)
router.get("/all", async (req, resp) => {
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ['admin']);
        if (isAdmin) {
            // Join with destination table to get destination name instead of ID
            const sql = `
                SELECT r.*, d.name as destination_name 
                FROM reviews r 
                LEFT JOIN destination d ON r.destination = d.id 
                ORDER BY r.date DESC
            `;
            const allReviews = await reviews.query(sql);
            
            // Replace destination ID with destination name and parse review_images
            const reviewsWithDestinationNames = allReviews.map(review => ({
                ...review,
                destination: review.destination_name || review.destination,
                review_images: parseReviewImages(review.review_images)
            }));
            
            return resp.send(reviewsWithDestinationNames);
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error fetching all reviews:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get text reviews only (for main reviews page)
router.get("/approved", async (req, resp) => {
    try {
        // Join with destination table to get destination name instead of ID
        const sql = `
            SELECT r.*, d.name as destination_name 
            FROM reviews r 
            LEFT JOIN destination d ON r.destination = d.id 
            WHERE r.review_type = 'text'
            ORDER BY r.date DESC
        `;
        const textReviews = await reviews.query(sql);
        
        // Replace destination ID with destination name and parse review_images
        const reviewsWithDestinationNames = textReviews.map(review => ({
            ...review,
            destination: review.destination_name || review.destination,
            review_images: parseReviewImages(review.review_images)
        }));
        
        return resp.send(reviewsWithDestinationNames);
    } catch (error) {
        console.log("Error fetching text reviews:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get video reviews only (for video reviews section)
router.get("/video-reviews", async (req, resp) => {
    try {
        // Join with destination table to get destination name instead of ID
        const sql = `
            SELECT r.*, d.name as destination_name 
            FROM reviews r 
            LEFT JOIN destination d ON r.destination = d.id 
            WHERE r.review_type = 'video'
            ORDER BY r.date DESC
        `;
        const videoReviews = await reviews.query(sql);
        
        // Replace destination ID with destination name and parse review_images
        const reviewsWithDestinationNames = videoReviews.map(review => ({
            ...review,
            destination: review.destination_name || review.destination,
            review_images: parseReviewImages(review.review_images)
        }));
        
        return resp.send(reviewsWithDestinationNames);
    } catch (error) {
        console.log("Error fetching video reviews:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Add a review with image
router.post('/add-with-image', async (req, res) => {
    try {
        const { name, rating, comment, review_type, destination } = req.body;
        const { admin } = req.headers;

        if (!admin) return res.status(401).send({ status: false, message: "Access Denied!" });

        try {
            const isAdmin = await user.isRole(admin, ['admin']);
            if (!isAdmin) return res.status(401).send({ status: false, message: "Access Denied!" });
        } catch (error) {
            console.log("Error authenticating admin:", error);
            return res.status(500).send({ status: false, message: "Internal Server Error" });
        }

        // Validate required fields
        if (!name || !rating) {
            return res.status(400).json({ message: 'Name and rating are required' });
        }

        // For text reviews, comment is required
        if (review_type === 'text' && !comment) {
            return res.status(400).json({ message: 'Comment is required for text reviews' });
        }

        // Create a new review object
        const newReview = {
            id: uuidv4(),
            name,
            rating: parseInt(rating),
            comment,
            destination: destination || '',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format date for MySQL
            review_type: review_type || 'text' // Default to text if not specified
        };

        // Handle image upload if present
        if (req.files && req.files.image) {
            let imageFile = req.files.image;
            
            // Handle multiple images - take the first one for now
            if (Array.isArray(imageFile)) {
                imageFile = imageFile[0];
            }
            
            // Validate file before processing
            if (!imageFile || !imageFile.data) {
                return res.status(400).json({ 
                    status: false, 
                    message: 'Invalid image file provided' 
                });
            }
            
            // Convert image to webp and upload
            const images = await image.convertAndUpload(imageFile, "reviews/images");
            if (images && images.insertId) {
                // Get the converted image path
                const imagePath = await image.getPathById(images.insertId);
                newReview.image_url = `/uploads/${imagePath}`;
                newReview.image_id = images.insertId; // Store image ID for future reference
            } else {
                return res.status(500).json({ 
                    status: false, 
                    message: 'Failed to process image upload' 
                });
            }
        }

        const result = await reviews.create(newReview);
        if (result) {
            return res.status(201).json({
                status: true,
                message: 'Review added successfully',
                review: newReview
            });
        } else {
            return res.status(500).json({ message: 'Failed to add review' });
        }
    } catch (error) {
        console.log('Error adding review with image:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Add a review with video
router.post('/add-with-video', async (req, res) => {
    try {
        const { name, destination, rating } = req.body;
        const { admin } = req.headers;

        if (!admin) return res.status(401).send({ status: false, message: "Access Denied!" });

        try {
            const isAdmin = await user.isRole(admin, ['admin']);
            if (!isAdmin) return res.status(401).send({ status: false, message: "Access Denied!" });
        } catch (error) {
            console.log("Error authenticating admin:", error);
            return res.status(500).send({ status: false, message: "Internal Server Error" });
        }

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Validate video file
        if (!req.files || !req.files.video) {
            return res.status(400).json({ message: 'Video file is required' });
        }

        // Create a new review object
        const newReview = {
            id: uuidv4(),
            name,
            rating: parseInt(rating) || 5, // Include rating for video reviews
            comment: '', // Empty comment for video reviews
            destination: destination || '',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '), // Format date for MySQL
            review_type: 'video'
        };

        // Handle video upload
        const videoFile = req.files.video;
        const uploadDir = path.join(__dirname, '../uploads/reviews/videos');
        
        // Ensure directory exists
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const fileName = `${newReview.id}-${Date.now()}${path.extname(videoFile.name)}`;
        const filePath = path.join(uploadDir, fileName);

        // Move the file to the upload directory
        await videoFile.mv(filePath);

        // Add video URL to the review
        newReview.video_url = `/uploads/reviews/videos/${fileName}`;

        const result = await reviews.create(newReview);
        if (result) {
            return res.status(201).json({
                status: true,
                message: 'Video review added successfully',
                review: newReview
            });
        } else {
            return res.status(500).json({ message: 'Failed to add review' });
        }
    } catch (error) {
        console.log('Error adding review with video:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Unified submit endpoint for both text and video reviews
router.post('/submit', async (req, res) => {
    try {
        const { name, rating, comment, review_type, destination } = req.body;
        const { admin } = req.headers;

        if (!admin) return res.status(401).send({ status: false, message: "Access Denied!" });

        try {
            const isAdmin = await user.isRole(admin, ['admin']);
            if (!isAdmin) return res.status(401).send({ status: false, message: "Access Denied!" });
        } catch (error) {
            console.log("Error authenticating admin:", error);
            return res.status(500).send({ status: false, message: "Internal Server Error" });
        }

        // Validate required fields
        if (!name) {
            return res.status(400).json({ message: 'Name is required' });
        }

        // Validate review type
        if (!review_type || review_type === 'none') {
            return res.status(400).json({ message: 'Please select a review type' });
        }

        if (!['text', 'video'].includes(review_type)) {
            return res.status(400).json({ message: 'Invalid review type' });
        }

        // For text reviews, comment is required
        if (review_type === 'text' && !comment) {
            return res.status(400).json({ message: 'Comment is required for text reviews' });
        }

        // For video reviews, video file is required
        if (review_type === 'video' && (!req.files || !req.files.video)) {
            return res.status(400).json({ message: 'Video file is required for video reviews' });
        }

        // Create a new review object
        const newReview = {
            id: uuidv4(),
            name,
            rating: parseInt(rating) || 5, // Default to 5 if not provided
            comment: review_type === 'text' ? comment : '',
            destination: destination || '',
            date: new Date().toISOString().slice(0, 19).replace('T', ' '),
            review_type: review_type || 'text'
        };

        // Handle file uploads based on review type
        if (req.files) {
            if (review_type === 'text' && req.files.image) {
                // Handle multiple images for text reviews
                let imageFiles = req.files.image;
                if (!Array.isArray(imageFiles)) {
                    imageFiles = [imageFiles];
                }

                const reviewImages = [];
                
                // Process all images
                for (const imageFile of imageFiles) {
                    if (imageFile && imageFile.data) {
                        const images = await image.convertAndUpload(imageFile, "reviews/images");
                        if (images && images.insertId) {
                            const imagePath = await image.getPathById(images.insertId);
                            reviewImages.push({
                                url: `/uploads/${imagePath}`,
                                id: images.insertId
                            });
                        }
                    }
                }

                // Store multiple images in JSON format
                if (reviewImages.length > 0) {
                    newReview.review_images = JSON.stringify(reviewImages);
                    // Also keep first image in legacy fields for backward compatibility
                    newReview.image_url = reviewImages[0].url;
                    newReview.image_id = reviewImages[0].id;
                }
            } else if (review_type === 'video') {
                // Handle video upload
                if (req.files.video) {
                    const videoFile = req.files.video;
                    const uploadDir = path.join(__dirname, '../uploads/reviews/videos');
                    
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }

                    const fileName = `${newReview.id}-${Date.now()}${path.extname(videoFile.name)}`;
                    const filePath = path.join(uploadDir, fileName);

                    await videoFile.mv(filePath);
                    newReview.video_url = `/uploads/reviews/videos/${fileName}`;
                }

                // Handle thumbnail upload for video reviews
                if (req.files.thumbnail) {
                    const thumbnailFile = req.files.thumbnail;
                    const images = await image.convertAndUpload(thumbnailFile, "reviews/images");
                    if (images && images.insertId) {
                        const imagePath = await image.getPathById(images.insertId);
                        newReview.thumbnail_url = `/uploads/${imagePath}`;
                        newReview.thumbnail_id = images.insertId;
                    }
                }
            }
        }

        const result = await reviews.create(newReview);
        if (result) {
            return res.status(201).json({
                status: true,
                message: 'Review submitted successfully',
                review: newReview
            });
        } else {
            return res.status(500).json({ message: 'Failed to submit review' });
        }
    } catch (error) {
        console.log('Error submitting review:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Edit a review (admin only)
router.post("/edit", async (req, resp) => {
    const { id, name, designation, rating, comment, status, review_type, destination } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ['admin']);
        if (isAdmin) {
            const updateData = {
                name,
                rating: parseInt(rating),
                comment,
                review_type,
                destination: destination || ''
            };

            const result = await reviews.update(updateData, { id });
            if (result) {
                return resp.send({
                    status: true,
                    message: "Review updated successfully"
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to update review"
                });
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error editing review:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Edit a review with image/video (admin only)
router.post("/edit-with-media", async (req, resp) => {
    const { id, name, rating, comment, review_type, destination } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ['admin']);
        if (isAdmin) {
            // Get the existing review
            const existingReviews = await reviews.findById(id);
            if (!existingReviews || existingReviews.length === 0) {
                return resp.status(404).send({
                    status: false,
                    message: "Review not found"
                });
            }
            
            const existingReview = existingReviews[0];
            
            // Create update data object
            const updateData = {
                name,
                rating: parseInt(rating),
                comment,
                review_type,
                destination: destination || ''
            };
            
            // Handle file uploads if any
            if (req.files) {
                // If updating a text review with images
                if (review_type === 'text' && req.files.image) {
                    // Delete old images from database and file system if exists
                    if (existingReview.review_images) {
                        try {
                            const oldImages = JSON.parse(existingReview.review_images);
                            for (const oldImage of oldImages) {
                                if (oldImage.id) {
                                    const oldImagePath = await image.getPathById(oldImage.id);
                                    if (oldImagePath) {
                                        const fullPath = path.join(__dirname, '../uploads', oldImagePath);
                                        if (fs.existsSync(fullPath)) {
                                            fs.unlinkSync(fullPath);
                                        }
                                        await image.delete({ id: oldImage.id });
                                    }
                                }
                            }
                        } catch (e) {
                            console.log('Error parsing old review images:', e);
                        }
                    } 
                    
                    // Also delete legacy single image if exists
                    if (existingReview.image_id) {
                        const oldImagePath = await image.getPathById(existingReview.image_id);
                        if (oldImagePath) {
                            const fullPath = path.join(__dirname, '../uploads', oldImagePath);
                            if (fs.existsSync(fullPath)) {
                                fs.unlinkSync(fullPath);
                            }
                            await image.delete({ id: existingReview.image_id });
                        }
                    } else if (existingReview.image_url) {
                        const oldImagePath = path.join(__dirname, '../uploads', existingReview.image_url.replace('/uploads/', ''));
                        if (fs.existsSync(oldImagePath)) {
                            fs.unlinkSync(oldImagePath);
                        }
                    }
                    
                    // Handle multiple new images
                    let imageFiles = req.files.image;
                    if (!Array.isArray(imageFiles)) {
                        imageFiles = [imageFiles];
                    }
                    
                    const reviewImages = [];
                    
                    // Process all images
                    for (const imageFile of imageFiles) {
                        if (imageFile && imageFile.data) {
                    const images = await image.convertAndUpload(imageFile, "reviews/images");
                    if (images && images.insertId) {
                        const imagePath = await image.getPathById(images.insertId);
                                reviewImages.push({
                                    url: `/uploads/${imagePath}`,
                                    id: images.insertId
                                });
                            }
                        }
                    }

                    // Store multiple images in JSON format
                    if (reviewImages.length > 0) {
                        updateData.review_images = JSON.stringify(reviewImages);
                        // Also keep first image in legacy fields for backward compatibility
                        updateData.image_url = reviewImages[0].url;
                        updateData.image_id = reviewImages[0].id;
                    } else {
                        return resp.status(500).send({
                            status: false,
                            message: "Failed to process image uploads"
                        });
                    }
                }
                
                // If updating a video review with a new video
                if (review_type === 'video' && req.files.video) {
                    // Delete old video if exists
                    if (existingReview.video_url) {
                        const oldVideoPath = path.join(__dirname, '../uploads', existingReview.video_url.replace('/uploads/', ''));
                        if (fs.existsSync(oldVideoPath)) {
                            fs.unlinkSync(oldVideoPath);
                        }
                    }
                    
                    // Upload new video
                    const videoFile = req.files.video;
                    const uploadDir = path.join(__dirname, '../uploads/reviews/videos');
                    
                    // Ensure directory exists
                    if (!fs.existsSync(uploadDir)) {
                        fs.mkdirSync(uploadDir, { recursive: true });
                    }
                    
                    const fileName = `${id}-${Date.now()}${path.extname(videoFile.name)}`;
                    const filePath = path.join(uploadDir, fileName);
                    
                    // Move the file to the upload directory
                    await videoFile.mv(filePath);
                    
                    // Update video URL
                    updateData.video_url = `/uploads/reviews/videos/${fileName}`;
                }

                // Handle thumbnail upload for video reviews
                if (review_type === 'video' && req.files.thumbnail) {
                    // Delete old thumbnail if exists
                    if (existingReview.thumbnail_id) {
                        const oldThumbnailPath = await image.getPathById(existingReview.thumbnail_id);
                        if (oldThumbnailPath) {
                            const fullPath = path.join(__dirname, '../uploads', oldThumbnailPath);
                            if (fs.existsSync(fullPath)) {
                                fs.unlinkSync(fullPath);
                            }
                            await image.delete({ id: existingReview.thumbnail_id });
                        }
                    } else if (existingReview.thumbnail_url) {
                        const oldThumbnailPath = path.join(__dirname, '../uploads', existingReview.thumbnail_url.replace('/uploads/', ''));
                        if (fs.existsSync(oldThumbnailPath)) {
                            fs.unlinkSync(oldThumbnailPath);
                        }
                    }

                    // Upload new thumbnail
                    const thumbnailFile = req.files.thumbnail;
                    const images = await image.convertAndUpload(thumbnailFile, "reviews/images");
                    if (images && images.insertId) {
                        const imagePath = await image.getPathById(images.insertId);
                        updateData.thumbnail_url = `/uploads/${imagePath}`;
                        updateData.thumbnail_id = images.insertId;
                    }
                }
            }
            
            const result = await reviews.update(updateData, { id });
            if (result) {
                // Get the updated review to return
                const updatedReview = await reviews.findById(id);
                
                return resp.send({
                    status: true,
                    message: "Review updated successfully",
                    review: updatedReview[0]
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to update review"
                });
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error editing review with media:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Delete a review (admin only)
router.delete("/delete/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ['admin']);
        if (isAdmin) {
            // Get the review to delete its files if any
            const reviewToDelete = await reviews.findById(id);

            if (reviewToDelete.length > 0) {
                const review = reviewToDelete[0];

                // Delete multiple images if exists
                if (review.review_images) {
                    try {
                        const reviewImages = JSON.parse(review.review_images);
                        for (const reviewImage of reviewImages) {
                            if (reviewImage.id) {
                                const imagePath = await image.getPathById(reviewImage.id);
                                if (imagePath) {
                                    const fullPath = path.join(__dirname, '../uploads', imagePath);
                                    if (fs.existsSync(fullPath)) {
                                        fs.unlinkSync(fullPath);
                                    }
                                    await image.delete({ id: reviewImage.id });
                                }
                            }
                        }
                    } catch (e) {
                        console.log('Error parsing review images for deletion:', e);
                    }
                }

                // Delete legacy single image if exists
                if (review.image_id) {
                    // Delete from image table and file system
                    const imagePath = await image.getPathById(review.image_id);
                    if (imagePath) {
                        const fullPath = path.join(__dirname, '../uploads', imagePath);
                        if (fs.existsSync(fullPath)) {
                            fs.unlinkSync(fullPath);
                        }
                        await image.delete({ id: review.image_id });
                    }
                } else if (review.image_url) {
                    // Handle legacy image URLs (for backward compatibility)
                    const imagePath = path.join(__dirname, "../uploads", review.image_url.replace('/uploads/', ''));
                    if (fs.existsSync(imagePath)) {
                        fs.unlinkSync(imagePath);
                    }
                }

                // Delete video file if exists
                if (review.video_url) {
                    const videoPath = path.join(__dirname, "../uploads", review.video_url.replace('/uploads/', ''));
                    if (fs.existsSync(videoPath)) {
                        fs.unlinkSync(videoPath);
                    }
                }

                // Delete thumbnail file if exists
                if (review.thumbnail_id) {
                    const thumbnailPath = await image.getPathById(review.thumbnail_id);
                    if (thumbnailPath) {
                        const fullPath = path.join(__dirname, '../uploads', thumbnailPath);
                        if (fs.existsSync(fullPath)) {
                            fs.unlinkSync(fullPath);
                        }
                        await image.delete({ id: review.thumbnail_id });
                    }
                } else if (review.thumbnail_url) {
                    const thumbnailPath = path.join(__dirname, "../uploads", review.thumbnail_url.replace('/uploads/', ''));
                    if (fs.existsSync(thumbnailPath)) {
                        fs.unlinkSync(thumbnailPath);
                    }
                }
            }

            const result = await reviews.delete({ id });
            if (result) {
                return resp.send({
                    status: true,
                    message: "Review deleted successfully"
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to delete review"
                });
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error deleting review:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Moderate a review (approve/reject) (admin only)
router.post("/moderate/:id", async (req, resp) => {
    const { id } = req.params;
    const { status } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!status || !['approved', 'rejected'].includes(status)) {
        return resp.status(400).send({ status: false, message: "Invalid status" });
    }

    try {
        const isAdmin = await user.isRole(admin, ['admin']);
        if (isAdmin) {
            const result = await reviews.update({ status }, { id });
            if (result) {
                return resp.send({
                    status: true,
                    message: `Review ${status} successfully`
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to update review status"
                });
            }
        } else {
            return resp.status(401).send({ status: false, message: "Access Denied!" });
        }
    } catch (error) {
        console.log("Error moderating review:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

module.exports = router;
