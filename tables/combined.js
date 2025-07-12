const Database = require("../database/db");

class Combined {
    constructor() {
        this.database = new Database();
        this.table = 'combined';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            type: "VARCHAR(500)",
            data: "LONGTEXT",
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

    async getAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        return await this.database.findAllWhere(this.table, { id: id });
    }

    async findAllWhere(data) {
        return await this.database.findAllWhere(this.table, data);
    }

    async update(id, data) {
        return await this.database.upate(this.table, data, { id: id });
    }

    async delete(id) {
        return await this.database.delete(this.table, { id: id });
    }
}

module.exports = Combined;
