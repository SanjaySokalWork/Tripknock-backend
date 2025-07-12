const Database = require("../database/db");
const Image = require("../tables/image");
const image = new Image();

class Season {
    constructor() {
        this.database = new Database();
        this.table = 'season';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            image: "VARCHAR(500)",
            slug: "VARCHAR(500)",
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
        const season = await this.database.findWhere(this.table, { id });
        return season.length > 0 ? season[0] : null;
    }

    async find(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async existsById(id) {
        return await this.database.exists(this.table, { id });
    }

    async existsBySlug(slug) {
        return await this.database.exists(this.table, { slug });
    }

    async create(season) {
        let imageId = null;
        if (!season.name || !season.image) return false;
        if (season.image) { imageId = await image.convertAndUpload(season.image, 'season'); }
        if (!imageId || imageId === null) return false;
        season.image = imageId.insertId;
        return await this.database.insertData(this.table, season);
    }

    async update(data, where) {
        if (data.image) {
            let imageId = await image.convertAndUpload(data.image, 'season');
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

module.exports = Season;
