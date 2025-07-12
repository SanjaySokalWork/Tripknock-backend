const Database = require("../database/db");
const Image = require("../tables/image");
const image = new Image();

class Theme {
    constructor() {
        this.database = new Database();
        this.table = 'theme';
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
        const themes = await this.database.findWhere(this.table, { id });
        return themes.length > 0 ? themes[0] : null;
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

    async create(theme) {
        let imageId = null;
        if (!theme.name || !theme.image) return false;
        if (theme.image) { imageId = await image.convertAndUpload(theme.image, 'theme'); }
        if (!imageId || imageId === null) return false;
        theme.image = imageId.insertId;
        return await this.database.insertData(this.table, theme);
    }

    async update(data, where) {
        if (data.image) {
            let imageId = await image.convertAndUpload(data.image, 'theme');
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

module.exports = Theme;
