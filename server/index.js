const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Postgres Configuration
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Test DB Connection
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error acquiring client', err.stack);
    }
    client.query('SELECT NOW()', (err, result) => {
        release();
        if (err) {
            return console.error('Error executing query', err.stack);
        }
        console.log('Connected to PostgreSQL Database');
    });
});

// Sync Endpoint
app.post('/api/sync-user', async (req, res) => {
    const { uid, email, name } = req.body;

    if (!uid || !email || !name) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Determine Role
    let role = 'user';
    if (email === 'abdulbaset1878@gmail.com' && name === 'Abdul Basit') {
        role = 'Admin';
    }

    try {
        // Check if user exists
        const checkRes = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);

        if (checkRes.rows.length > 0) {
            // User exists, maybe update? For now just return success.
            return res.status(200).json({ message: 'User already synced' });
        }

        // Insert new user
        const insertQuery = `
      INSERT INTO users (firebase_uid, email, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [uid, email, name, role];
        const result = await pool.query(insertQuery, values);

        console.log(`User synced: ${email} as ${role}`);
        res.status(201).json({ user: result.rows[0] });

    } catch (error) {
        console.error('Error syncing user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get User Role Endpoint
app.get('/api/user-role/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        const result = await pool.query('SELECT role FROM users WHERE firebase_uid = $1', [uid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ role: result.rows[0].role });
    } catch (error) {
        console.error('Error fetching user role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
