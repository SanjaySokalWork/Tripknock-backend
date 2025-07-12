const Database = require("../database/db");

class Destination {
    constructor() {
        this.database = new Database();
        this.table = 'destination';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            type: "VARCHAR(500)",
            country: "VARCHAR(500)",
            title: "VARCHAR(500)",
            slug: "VARCHAR(500)",
            images: "LONGTEXT",
            description: "LONGTEXT NOT NULL",
            meta: "LONGTEXT",
            popularPackages: "LONGTEXT",
            mainPackages: "LONGTEXT",
            longDescription: "LONGTEXT NOT NULL",
            faqs: "LONGTEXT",
            status: "ENUM ('draft', 'published') DEFAULT 'draft'",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(destination) {
        return await this.database.insertData(this.table, destination);
    }

    async existsBySlug(slug) {
        return await this.database.exists(this.table, { slug });
    }

    async exists(destination) {
        return await this.database.exists(this.table, destination);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async update(destination, where) {
        return await this.database.update(this.table, destination, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = Destination;
