const express = require("express");
const router = express.Router();
const { connection } = require("../database/connection");

router.get("/api", async (req, resp) => {
    try {
        const conn = await connection;
        await conn.query("SELECT * FROM user");
        resp.send({ data: "Database is connected" });
    } catch (err) {
        console.error("Query error in /test/api:", err);
        resp.status(500).send({ status: false, message: "Database query failed" });
    }
});

module.exports = router;
