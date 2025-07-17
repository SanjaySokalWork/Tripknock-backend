const Database = require("../database/db");

class User {
    constructor() {
        this.database = new Database();
        this.table = 'user';
        this.data = {
            id: "INT(155) UNSIGNED AUTO_INCREMENT PRIMARY KEY",
            name: "VARCHAR(500)",
            email: "VARCHAR(500) UNIQUE",
            phone: "VARCHAR(500)",
            password: "VARCHAR(500)",
            role: "ENUM('admin', 'superadmin', 'subadmin', 'blogger', 'user') DEFAULT 'user'",
            status: "ENUM('active', 'inactive') DEFAULT 'active'",
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

    async existByEmail(email) {
        return await this.database.exists(this.table, { email: email });
    }

    async findByEmail(email) {
        const users = await this.database.findWhere(this.table, { email: email });
        return users.length > 0 ? users[0] : null;
    }

    async findById(id) {
        const users = await this.database.findWhere(this.table, { id: id });
        return users.length > 0 ? users[0] : null;
    }

    async find(where) {
        return await this.database.findAllWhere(this.table, where);
    }

    async isActive(email) {
        const exists = await this.existByEmail(email);
        if (!exists) return false;

        const user = await this.findByEmail(email);
        return user ? user.status === "active" : false;
    }

    async isRole(email, roles = []) {
        const exists = await this.existByEmail(email);
        if (!exists) return false;

        const user = await this.findByEmail(email);
        let check = false;
        roles.forEach(role => {
            if (role === user.role) {
                check = true;
                return;
            }
        })
        return check;
    }

    async create(user) {
        return await this.database.insertData(this.table, user);
    }

    async update(data, where) {
        return this.database.upate(this.table, data, where);
    }

    async delete(where) {
        return await this.database.delete(this.table, where);
    }

    async existsById(id) {
        return await this.database.exists(this.table, { id: id });
    }
}

module.exports = User;
