const Database = require("../database/db");

class Meta {
    constructor() {
        this.database = new Database();
        this.table = 'meta';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            title: "VARCHAR(500)",
            description: "VARCHAR(500)",
            extra: "VARCHAR(500)",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = Meta;
