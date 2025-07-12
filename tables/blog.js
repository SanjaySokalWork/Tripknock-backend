const Database = require("../database/db");

class Blog {
    constructor() {
        this.database = new Database();
        this.table = 'blog';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            title: "VARCHAR(255) NOT NULL",
            slug: "VARCHAR(255) NOT NULL UNIQUE",
            content: "LONGTEXT NOT NULL",
            featured_image: "VARCHAR(255)",
            category: "TEXT",
            tags: "TEXT",
            status: "ENUM('draft', 'published') DEFAULT 'draft'",
            author: "VARCHAR(255)",
            meta: "LONGTEXT",
            created_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
            updated_at: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(blog) {
        return await this.database.insertData(this.table, blog);
    }

    async exists(where) {
        return await this.database.exists(this.table, where);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        const results = await this.database.findAllWhere(this.table, { id });
        return results.length > 0 ? results[0] : null;
    }

    async findBySlug(slug) {
        const results = await this.database.findAllWhere(this.table, { slug });
        return results.length > 0 ? results[0] : null;
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async countByCategory(category) {
        return (await this.database.query(`SELECT * FROM ${this.table} WHERE category LIKE '%${category}%'`)).length;
    }

    async countByTag(tag) {
        return (await this.database.query(`SELECT * FROM ${this.table} WHERE tags LIKE '%${tag}%'`)).length;
    }

    async update(data, where) {
        return await this.database.upate(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }
}

module.exports = Blog;
