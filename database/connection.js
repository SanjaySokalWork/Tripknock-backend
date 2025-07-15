const mysql = require("mysql2/promise");

const development = {
    host: "localhost",
    user: "root",
    password: "password",
    database: "trip"
};

const production = {
    host: "localhost",
    user: "eazyjkmj_tripknock",
    database: "eazyjkmj_tripknock",
    password: "j6l9%M}x-kD&"
}

const type = production;

const connection = mysql.createConnection({
    host: type.host,
    user: type.user,
    password: type.password,
    database: type.database,
    dateStrings: true
});

let logging = sql => console.warn("\x1b[35m\n[QUERY] Executed:: " + sql);

logging = sql => { };

module.exports = { connection, logging };
