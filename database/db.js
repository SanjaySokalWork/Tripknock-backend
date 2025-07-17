const connection = require("../database/connection");

class Database {
    constructor() {
        this.connection = connection.connection;
        this.logging = connection.logging || (() => { });
    }

    async createTable(table, columns) {
        if (table.trim() === "") return false;

        try {
            let sql = '';

            const keys = Object.keys(columns);
            const value = Object.values(columns);

            const length = keys.length;
            sql += `\`${keys[0]}\` ${value[0]}`;
            if (length > 0) {
                for (let i = 1; i < length; i++) {
                    sql += `,\n \`${keys[i]}\` ${value[i]}`;
                }
            }
            const execute = `CREATE TABLE IF NOT EXISTS \`${table}\` (\n  ${sql}\n);`;
            await this.query(execute);
            return true;
        } catch (err) {
            console.log(`Error in ${table} Table ` + err)
            return false;
        }
    }

    async dropTable(table) {
        let sql = `DROP TABLE IF EXISTS \`${table}\`;`;
        try {
            await this.query(sql);
            return true;
        } catch (error) {
            console.log(`Error dropping table "${table}": `, error);
            return false;
        }
    }

    async truncateTable(table) {
        let sql = `truncate table \`${table}\`;`;

        try {
            await this.query(sql);
            return true;
        } catch (error) {
            console.log(`Error truncate table "${table}": `, error);
            return false;
        }
    }

    async insertData(table, data) {
        try {
            let columns = Object.keys(data).map(col => `\`${col}\``).join(", ");
            let placeholders = Object.keys(data).map(() => '?').join(", ");

            let sql = `INSERT INTO \`${table}\` (${columns}) VALUES (${placeholders});`;
            let values = Object.values(data);

            return (await this.query(sql, values));
        } catch (err) {
            console.log(`Error inserting data into "${table}":`, err);
            return false;
        }
    }

    async findAll(table) {
        let sql = `SELECT * FROM \`${table}\` ORDER BY ID DESC;`;

        try {
            return (await this.query(sql));
        } catch (error) {
            console.log(`failed to fetch data from "${table}": `, error);
            return [];
        }
    }

    async findLast(table) {
        let sql = `SELECT * FROM \`${table}\` LIMIT 1;`;

        try {
            return (await this.query(sql));
        } catch (error) {
            console.log(`failed to fetch data from "${table}": `, error);
            return [];
        }
    }

    async findOne(table) {
        let sql = `SELECT * FROM \`${table}\` ORDER BY ID DESC LIMIT 1;`;

        try {
            return (await this.query(sql));
        } catch (error) {
            console.log(`failed to fetch data from "${table}": `, error);
            return [];
        }
    }

    async findFirst(table) {
        return (await this.findOne(table));
    }

    async findAllWhere(table, where) {
        try {
            let sql = `SELECT * FROM \`${table}\` WHERE `;

            const keys = Object.keys(where);
            const values = Object.values(where);

            const length = keys.length;
            sql += `\`${keys[0]}\` = '${values[0]}' `;
            if (length > 0) {
                for (let i = 1; i < length; i++) {
                    sql += `AND \`${keys[i]}\` = '${values[i]}' `;
                }
            }

            // console.log(this.query(sql))

            return (await this.query(sql));
        } catch (error) {
            console.log(`failed to fetch data from "${table}": `, error);
            return [];
        }
    }

    async findWhere(table, where) {
        return (await this.findAllWhere(table, where))
    }

    async upate(table, values, where) {
        try {
            let sql = `UPDATE \`${table}\` SET `;

            const keys = Object.keys(values);
            const value = Object.values(values);

            const length = keys.length;
            sql += `\`${keys[0]}\` = ? `;
            if (length > 0) {
                for (let i = 1; i < length; i++) {
                    sql += `, \`${keys[i]}\` = ?`;
                }
            }

            const keys2 = Object.keys(where);
            const values2 = Object.values(where);

            const length2 = keys2.length;
            sql += ` WHERE \`${keys2[0]}\` = ? `;
            if (length2 > 0) {
                for (let i = 1; i < length2; i++) {
                    sql += `AND \`${keys2[i]}\` = ? `;
                }
            }

            // Combine all values for prepared statement
            const allValues = [...value, ...values2];

            return (await this.query(sql, allValues));
        } catch (error) {
            console.log(`failed to update data in "${table}": `, error);
            return [];
        }
    }

    async update(table, values, where) {
        return (await this.upate(table, values, where));
    }

    async exists(table, where) {
        try {
            let sql = `SELECT * FROM \`${table}\` WHERE `;

            const keys = Object.keys(where);
            const values = Object.values(where);

            const length = keys.length;
            sql += `\`${keys[0]}\` = '${values[0]}' `;
            if (length > 0) {
                for (let i = 1; i < length; i++) {
                    sql += `AND \`${keys[i]}\` = '${values[i]}' `;
                }
            }
            this.logging(sql);
            const [data] = await this.connection.query(sql);
            if (data.length > 0) return true;
            return false;
        } catch (error) {
            console.log(`failed to check exists in "${table}": `, error);
            return false;
        }
    }

    async delete(table, where) {
        try {
            let sql = `DELETE FROM \`${table}\` WHERE `;

            const keys = Object.keys(where);
            const values = Object.values(where);

            const length = keys.length;
            sql += `\`${keys[0]}\` = '${values[0]}' `;
            if (length > 0) {
                for (let i = 1; i < length; i++) {
                    sql += `AND \`${keys[i]}\` = '${values[i]}' `;
                }
            }

            return (await this.query(sql));
        } catch (error) {
            console.log(`failed to fetch data from "${table}": `, error);
            return [];
        }
    }

    async addColumn(table, columnName, columnDefinition) {
        try {
            // Check if column already exists
            const checkSql = `SHOW COLUMNS FROM \`${table}\` LIKE '${columnName}';`;
            const result = await this.query(checkSql);

            if (result.length === 0) {
                // Column doesn't exist, add it
                const sql = `ALTER TABLE \`${table}\` ADD COLUMN \`${columnName}\` ${columnDefinition};`;
                await this.query(sql);
                console.log(`Added column '${columnName}' to table '${table}'`);
                return true;
            } else {
                console.log(`Column '${columnName}' already exists in table '${table}'`);
                return true;
            }
        } catch (error) {
            console.log(`Error adding column '${columnName}' to table '${table}':`, error);
            return false;
        }
    }

    async query(sql, params = []) {
        this.logging(sql);
        try {
            const [results] = await this.connection.query(sql, params);
            return results;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Database;
