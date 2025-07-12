const Database = require("../database/db");

class FAQ {
    constructor() {
        this.database = new Database();
        this.table = 'faq';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            question: "VARCHAR(500)",
            answer: "LONGTEXT",
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

    async create(question, answer) {
        const sql = `INSERT INTO ${this.table} (question, answer) VALUES ('${question}', '${answer}')`;
        return await this.query(sql);
    }

    async update(id, question, answer) {
        const sql = `UPDATE ${this.table} SET question = '${question}', answer = '${answer}' WHERE id = ${id}`;
        return await this.query(sql);
    }

    async delete(id) {
        const sql = `DELETE FROM ${this.table} WHERE id = ${id}`;
        return await this.query(sql);
    }

    async query(sql) {
        return await this.database.query(sql);
    }
}

module.exports = FAQ;
