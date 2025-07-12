const express = require("express");
const cors = require("cors");
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File Upload Middleware
app.use(fileUpload({
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
    abortOnLimit: true,
    responseOnLimit: "File size limit exceeded",
    createParentPath: true // Automatically creates upload directories
}));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/user", require("./api/user"));
app.use("/image", require("./api/image"));
app.use("/season", require("./api/season"));
app.use("/theme", require("./api/theme"));
app.use("/themes-pages", require("./api/themes-pages"));
app.use("/include", require("./api/include"));
app.use("/country", require("./api/country"));
app.use("/package", require("./api/package"));
app.use("/destination", require("./api/destination"));
app.use("/blog", require("./api/blog"));
app.use("/blog/comments", require("./api/blog-comment"));
app.use("/blog/categories", require("./api/blog-category"));
app.use("/blog/tags", require("./api/blog-tag"));
app.use("/reviews", require("./api/reviews"));
app.use("/stats", require("./api/stats"));
app.use("/homepage", require("./api/homepage"));

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("*", (req, res) => {
    res.send("Hello World!");
});

app.listen(5000);
