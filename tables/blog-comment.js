const Database = require("../database/db");

class BlogComment {
    constructor() {
        this.database = new Database();
        this.table = 'blog_comment';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            blog_id: "VARCHAR(255)",
            author: "VARCHAR(255)",
            email: "VARCHAR(255)",
            phone: "VARCHAR(255)",
            content: "LONGTEXT NOT NULL",
            status: "ENUM ('pending', 'approved', 'rejected') DEFAULT 'pending'",
            parent_id: "INT(155) UNSIGNED DEFAULT NULL",
            is_admin_reply: "BOOLEAN DEFAULT FALSE",
            date: "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
        };

        this.initializeTable();
    }

    async initializeTable() {
        await this.database.createTable(this.table, this.data);
    }

    async create(comment) {
        return await this.database.insertData(this.table, comment);
    }

    async exists(where) {
        return await this.database.exists(this.table, where);
    }

    async findAll() {
        return await this.database.findAll(this.table);
    }

    async findById(id) {
        return await this.database.findAllWhere(this.table, { id });
    }

    async findAllWhere(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async findReplies(parentId) {
        return await this.database.findAllWhere(this.table, { parent_id: parentId });
    }

    async update(data, where) {
        return await this.database.upate(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }
}

module.exports = BlogComment;
