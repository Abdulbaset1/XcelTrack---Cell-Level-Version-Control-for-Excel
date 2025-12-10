const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.query('SELECT * FROM users', (err, res) => {
    if (err) {
        console.error('Error executing query', err.stack);
    } else {
        console.log('User count:', res.rows.length);
        console.log('Users:', res.rows);
    }
    pool.end();
});
