const mysql = require("mysql2")

const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password",
    database: "trip",
    dateStrings: true
})

let logging = sql => console.warn("\x1b[35m\n[QUERY] Executed:: " + sql);

logging = sql => { };

module.exports = { connection, logging }
