const Database = require("../database/db");

class Package {
    constructor() {
        this.database = new Database();
        this.table = 'package';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            title: "VARCHAR(500)",
            slug: "VARCHAR(500)",
            time: "LONGTEXT",
            rating: "VARCHAR(500)",
            maxGroup: "VARCHAR(500)",
            destinations: "LONGTEXT",
            seasons: "LONGTEXT",
            customize: "ENUM ('no', 'yes') DEFAULT 'yes'",
            marking: "VARCHAR(500)",
            images: "LONGTEXT",
            meta: "LONGTEXT",
            overview: "LONGTEXT",
            journey: "LONGTEXT",
            itinerary: "LONGTEXT",
            inclusions: "LONGTEXT",
            exclusions: "LONGTEXT",
            additionalInfo: "LONGTEXT",
            price: "LONGTEXT",
            faq: "LONGTEXT",
            includes: "LONGTEXT",
            themes: "LONGTEXT",
            status: "ENUM ('draft', 'published') DEFAULT 'draft'",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(data) {
        return await this.database.insertData(this.table, data);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findOneWhere(where) {
        let res = await this.database.findWhere(this.table, where);
        return res.length > 0 ? res[0] : [];
    }

    async findById(id) {
        return await this.database.findAllWhere(this.table, { id });
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async findBySlug(slug) {
        let res = await this.database.findAllWhere(this.table, { slug });
        return res.length > 0 ? res[0] : [];
    }

    async existById(id) {
        return await this.database.exists(this.table, { id: id });
    }

    async existBySlug(slug) {
        return await this.database.exists(this.table, { slug: slug });
    }

    async delte(id) {
        return await this.database.delete(this.table, { id });
    }

    async query(sql) {
        return await this.database.query(sql);
    }

    async update(data, where) {
        return await this.database.upate(this.table, data, where);
    }
}

module.exports = Package;
