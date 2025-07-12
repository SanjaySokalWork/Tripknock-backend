const Database = require("../database/db");

class Reviews {
    constructor() {
        this.database = new Database();
        this.table = 'reviews';
        this.data = {
            id: "VARCHAR(36) PRIMARY KEY",
            name: "VARCHAR(255) NOT NULL",
            designation: "VARCHAR(255)",
            rating: "INT(1) NOT NULL",
            comment: "TEXT",
            image_url: "VARCHAR(255)",
            image_id: "INT(155)",
            review_images: "JSON", // Multiple images for text reviews
            video_url: "VARCHAR(255)",
            thumbnail_url: "VARCHAR(255)",
            thumbnail_id: "INT(155)",
            destination: "VARCHAR(255)",
            review_type: "ENUM ('text', 'video') DEFAULT 'text'",
            date: "DATETIME DEFAULT CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
        
        // Add destination column if it doesn't exist (for existing tables)
        // await this.database.addColumn(this.table, 'destination', 'VARCHAR(255)');
        
        // Add thumbnail columns if they don't exist (for existing tables)
        // try {
        //     await this.database.addColumn(this.table, 'thumbnail_url', 'VARCHAR(255)');
        //     await this.database.addColumn(this.table, 'thumbnail_id', 'INT(155)');
        //     await this.database.addColumn(this.table, 'review_images', 'JSON');
        // } catch (error) {
        //     // Columns might already exist, ignore error
        //     console.log('New columns might already exist in reviews table');
        // }
    }

    async create(review) {
        return await this.database.insertData(this.table, review);
    }

    async exists(where) {
        return await this.database.exists(this.table, where);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        return await this.database.findAllWhere(this.table, { id });
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async findApproved() {
        return await this.database.findAllWhere(this.table, { status: 'approved' });
    }

    async update(data, where) {
        return await this.database.update(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = Reviews;
