const Database = require("../database/db");

class BlogTag {
    constructor() {
        this.database = new Database();
        this.table = 'blog_tag';
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

    async create(tag) {
        return await this.database.insertData(this.table, tag);
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

    async findByName(name) {
        const results = await this.database.findAllWhere(this.table, { name });
        return results.length > 0 ? results[0] : null;
    }

    async find(by) {
        const results = await this.database.findAllWhere(this.table, by);
        return results.length > 0 ? results[0] : null;
    }

    async countByTag(tag) {
        return (await this.database.query(`SELECT * FROM blog WHERE tags LIKE '%${tag}%'`)).length;
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

module.exports = BlogTag;
