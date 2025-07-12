const Database = require("../database/db");
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

class Image {
    constructor() {
        this.database = new Database();
        this.table = 'image';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            file_path: "VARCHAR(500)",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async findById(id) {
        const images = await this.database.findWhere(this.table, { id: id });
        return images.length > 0 ? images[0] : null;
    }

    async find(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async convertAndUpload(file, folder = "uploads") {
        try {
            if (!file) {
                throw new Error('No file provided for conversion');
            }

            if (!file.data) {
                throw new Error('File data is missing - ensure express-fileupload middleware is properly configured');
            }

            if (!file.mimetype || !file.mimetype.startsWith('image/')) {
                throw new Error('Please provide a valid image file');
            }

            // Ensure the uploads folder exists
            const outputPath = path.join(__dirname, "../uploads/", folder);
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            let imgName = `${timestamp}-${randomString}-${file.name.split('.')[0]}.webp`;
            imgName = imgName.replaceAll(" ", "-");
            let outputFilePath = path.join(outputPath, imgName);

            // Convert image to WebP format and save it
            await sharp(file.data)
                .webp({
                    quality: 80,
                    lossless: false,
                    effort: 6,
                    nearLossless: false
                })
                .toFile(outputFilePath);

            imgName = folder + "/" + imgName;

            return await this.database.insertData(this.table, { name: file.name, file_path: imgName })
        } catch (error) {
            console.log('Error converting and uploading image:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async convert(file, folder = "uploads") {
        try {
            if (!file || !file.data) {
                throw new Error('No file provided for conversion');
            }

            if (!file.mimetype || !file.mimetype.startsWith('image/')) {
                throw new Error('Please provide a valid image file');
            }

            // Ensure the uploads folder exists
            const outputPath = path.join(__dirname, "../uploads/", folder);
            if (!fs.existsSync(outputPath)) {
                fs.mkdirSync(outputPath, { recursive: true });
            }

            // Generate unique filename
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(7);
            let imgName = `${timestamp}-${randomString}-${file.name.split('.')[0]}.webp`;
            let outputFilePath = path.join(outputPath, imgName);

            // Convert image to WebP format and save it
            await sharp(file.data)
                .webp({
                    quality: 80,
                    lossless: false,
                    effort: 6,
                    nearLossless: false
                })
                .toFile(outputFilePath);

            imgName = folder + "/" + imgName;

            return imgName;
        } catch (error) {
            console.log('Error converting and uploading image:', error);
            return {
                success: false,
                message: error.message
            };
        }
    }

    async getidByPath(path) {
        const images = await this.database.findWhere(this.table, { file_path: path });
        return images.length > 0 ? images[0].id : null;
    }

    async getPathById(id) {
        const images = await this.database.findWhere(this.table, { id: id });
        return images.length > 0 ? images[0].file_path : null;
    }
}

module.exports = Image;
