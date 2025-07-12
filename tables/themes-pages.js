const Database = require("../database/db");

class ThemesPages {
    constructor() {
        this.database = new Database();
        this.table = 'themes_pages';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            type: "VARCHAR(500)",
            title: "VARCHAR(500)",
            slug: "VARCHAR(500)",
            images: "LONGTEXT",
            description: "LONGTEXT",
            meta: "LONGTEXT",
            popularDestinations: "LONGTEXT",
            mainPackages: "LONGTEXT",
            longDescription: "LONGTEXT",
            faqs: "LONGTEXT",
            status: "ENUM ('draft', 'published') DEFAULT 'draft'",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(themePage) {
        return await this.database.insertData(this.table, themePage);
    }

    async existsBySlug(slug) {
        return await this.database.exists(this.table, { slug: slug });
    }

    async exists(themePage) {
        return await this.database.exists(this.table, themePage);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async update(themePage, where) {
        return await this.database.upate(this.table, themePage, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = ThemesPages; 