const Database = require("../database/db");

class BlogCategory {
    constructor() {
        this.database = new Database();
        this.table = 'blog_category';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(255) NOT NULL",
            slug: "VARCHAR(255) NOT NULL UNIQUE",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(category) {
        return await this.database.insertData(this.table, category);
    }

    async exists(where) {
        return await this.database.exists(this.table, where);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        const results = await this.database.findAllWhere(this.table, { id: id });
        return results.length > 0 ? results[0] : null;
    }

    async findBySlug(slug) {
        const results = await this.database.findAllWhere(this.table, { slug });
        return results.length > 0 ? results[0] : null;
    }

    async findByName(name) {
        const results = await this.database.findAllWhere(this.table, { name });
        return results.length > 0 ? results[0] : null;
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async update(data, where) {
        return await this.database.upate(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }
}

module.exports = BlogCategory;
