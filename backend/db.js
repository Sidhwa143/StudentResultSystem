const { Pool } = require("pg");

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "student_result_db",
    password: "Sidhwa@143",
    port: 5432
});

module.exports = pool;