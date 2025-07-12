const Database = require("../database/db");
const Image = require("../tables/image");
const image = new Image();

class Include {
    constructor() {
        this.database = new Database();
        this.table = 'include';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            image: "VARCHAR(500)",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        const includes = await this.database.findWhere(this.table, { id });
        return includes.length > 0 ? includes[0] : null;
    }

    async find(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async existsById(id) {
        return await this.database.exists(this.table, { id });
    }

    async create(include) {
        let imageId = null;
        if (!include.name || !include.image) return false;
        if (include.image) { imageId = await image.convertAndUpload(include.image, 'include'); }
        if (!imageId || imageId === null) return false;
        include.image = imageId.insertId;
        return await this.database.insertData(this.table, include);
    }

    async update(data, where) {
        if (data.image) {
            let imageId = await image.convertAndUpload(data.image, 'include');
            if (!imageId || imageId === null) return false;
            data.image = imageId.insertId;
        }
        return this.database.upate(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = Include;
