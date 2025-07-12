const Database = require("../database/db");

class Itinerary {
    constructor() {
        this.database = new Database();
        this.table = 'itinerary';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            day: "VARCHAR(500)",
            title: "VARCHAR(500)",
            description: "VARCHAR(500)",
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

    async create(day, title, description) {
        const sql = `INSERT INTO ${this.table} (day, title, description) VALUES ('${day}', '${title}', '${description}')`;
        return await this.query(sql);
    }

    async update(id, day, title, description) {
        const sql = `UPDATE ${this.table} SET day = '${day}', title = '${title}', description = '${description}' WHERE id = ${id}`;
        return await this.query(sql);
    }

    async delete(id) {
        return await this.database.delete(this.table, { id });
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = Itinerary;
