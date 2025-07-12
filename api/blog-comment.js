const express = require("express");
const router = express.Router();
const User = require("../tables/user");
const user = new User();
const BlogComment = require("../tables/blog-comment");
const blogComment = new BlogComment();

// Get all comments (for admin)
router.get("/all", async (req, resp) => {
    const { admin } = req.headers;
    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const comments = await blogComment.findAll();
            
            // Format comments with their replies
            const formattedComments = await Promise.all(comments.map(async (comment) => {
                if (comment.parent_id === null) {
                    const replies = await blogComment.findReplies(comment.id);
                    return { ...comment, replies };
                }
                return null;
            }));
            
            // Filter out null values (replies that were processed with their parents)
            const rootComments = formattedComments.filter(comment => comment !== null);
            
            return resp.send(rootComments);
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error in /all route:", error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Get comments for a specific blog post (public)
router.get("/:blogId", async (req, resp) => {
    const { blogId } = req.params;

    try {
        // Get all approved root comments for this blog
        const rootComments = await blogComment.findAllWhere({
            blog_id: blogId,
            status: 'approved',
            parent_id: null
        });
        
        // For each root comment, get its replies
        const commentsWithReplies = await Promise.all(rootComments.map(async (comment) => {
            const replies = await blogComment.findReplies(comment.id);
            // Only include approved replies or admin replies
            const filteredReplies = replies.filter(reply => 
                reply.status === 'approved' || reply.is_admin_reply === true
            );
            return { ...comment, replies: filteredReplies };
        }));
        
        return resp.send(commentsWithReplies);
    } catch (error) {
        console.log(`Error fetching comments for blog ${blogId}:`, error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Add a new comment
router.post("/add", async (req, resp) => {
    const { blogId, author, email, content, phone, parentId } = req.body;

    if (!blogId || !content) {
        return resp.status(400).send({
            status: false,
            message: "Missing required fields"
        });
    }

    try {
        const commentData = {
            blog_id: blogId,
            author: author || "Anonymous",
            email: email || "",
            phone: phone || "",
            content,
            parent_id: parentId || null,
            status: 'pending'
        };

        const result = await blogComment.create(commentData);
        if (result) {
            return resp.send({
                status: true,
                message: "Comment added successfully and pending approval"
            });
        } else {
            return resp.status(500).send({
                status: false,
                message: "Failed to add comment"
            });
        }
    } catch (error) {
        console.log("Error adding comment:", error);
        return resp.status(500).send({
            status: false,
            message: "Internal Server Error"
        });
    }
});

// Add a reply as admin
router.post("/admin-reply", async (req, resp) => {
    const { blogId, content, parentId } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!blogId || !content || !parentId) {
        return resp.status(400).send({
            status: false,
            message: "Missing required fields"
        });
    }

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const adminData = await user.findByEmail(admin);
            
            const commentData = {
                blog_id: blogId,
                author: adminData.name,
                email: adminData.email,
                content,
                parent_id: parentId,
                is_admin_reply: true,
                status: 'approved' // Admin replies are automatically approved
            };

            const result = await blogComment.create(commentData);
            if (result) {
                return resp.send({
                    status: true,
                    message: "Reply added successfully"
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to add reply"
                });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error adding admin reply:", error);
        return resp.status(500).send({
            status: false,
            message: "Internal Server Error"
        });
    }
});

// Edit a comment
router.post("/edit", async (req, resp) => {
    const { id, author, email, content, status, phone } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const commentData = {
                author: author || "Anonymous",
                email: email || "",
                phone: phone || "",
                content,
                status
            };

            const result = await blogComment.update(commentData, { id });
            if (result) {
                return resp.send({
                    status: true,
                    message: "Comment updated successfully"
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to update comment"
                });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error updating comment:", error);
        return resp.status(500).send({
            status: false,
            message: "Internal Server Error"
        });
    }
});

// Delete a comment
router.delete("/delete/:id", async (req, resp) => {
    const { id } = req.params;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            // First, delete all replies to this comment
            await blogComment.delete({ parent_id: id });
            
            // Then delete the comment itself
            const result = await blogComment.delete({ id });
            if (result) {
                return resp.send({
                    status: true,
                    message: "Comment and all replies deleted successfully"
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to delete comment"
                });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error deleting comment:", error);
        return resp.status(500).send({
            status: false,
            message: "Internal Server Error"
        });
    }
});

// Get replies for a specific comment
router.get("/replies/:commentId", async (req, resp) => {
    const { commentId } = req.params;

    try {
        const replies = await blogComment.findReplies(commentId);
        
        // For public access, only return approved replies or admin replies
        const filteredReplies = replies.filter(reply => 
            reply.status === 'approved' || reply.is_admin_reply === true
        );
        
        return resp.send(filteredReplies);
    } catch (error) {
        console.log(`Error fetching replies for comment ${commentId}:`, error);
        return resp.status(500).send({ status: false, message: "Internal Server Error" });
    }
});

// Approve or reject a comment
router.post("/moderate/:id", async (req, resp) => {
    const { id } = req.params;
    const { status } = req.body;
    const { admin } = req.headers;

    if (!admin) return resp.status(401).send({ status: false, message: "Access Denied!" });
    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
        return resp.status(400).send({
            status: false,
            message: "Invalid status value"
        });
    }

    try {
        const isAdmin = await user.isRole(admin, ["admin", "subadmin"]);
        if (isAdmin) {
            const result = await blogComment.update({ status }, { id });
            if (result) {
                return resp.send({
                    status: true,
                    message: `Comment ${status} successfully`
                });
            } else {
                return resp.status(500).send({
                    status: false,
                    message: "Failed to update comment status"
                });
            }
        }
        return resp.status(401).send({ status: isAdmin, message: "Access Denied!" });
    } catch (error) {
        console.log("Error moderating comment:", error);
        return resp.status(500).send({
            status: false,
            message: "Internal Server Error"
        });
    }
});

module.exports = router;
