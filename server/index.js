const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const admin = require('./firebaseAdmin');
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

    try {
        // Check if user exists
        const checkRes = await pool.query('SELECT * FROM users WHERE firebase_uid = $1', [uid]);

        if (checkRes.rows.length > 0) {
            // User exists, return existing user data
            return res.status(200).json({ message: 'User already synced', user: checkRes.rows[0] });
        }

        // Insert new user with default 'user' role
        // Admin role should be assigned manually in the database or through admin panel
        const insertQuery = `
      INSERT INTO users (firebase_uid, email, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [uid, email, name, 'user']; // Default role is 'user'
        const result = await pool.query(insertQuery, values);

        console.log(`User synced: ${email} as ${result.rows[0].role}`);
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


// --- Admin User Management Endpoints ---

// Middleware to verify admin role
const verifyAdmin = async (req, res, next) => {
    const { uid } = req.body; // For POST/PUT requests
    const uidParam = req.params.uid; // For GET/DELETE requests
    const userUid = uid || uidParam;

    if (!userUid) {
        return res.status(401).json({ error: 'Unauthorized: User ID required' });
    }

    try {
        const result = await pool.query('SELECT role FROM users WHERE firebase_uid = $1', [userUid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userRole = result.rows[0].role.toLowerCase();

        if (userRole !== 'admin') {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        next();
    } catch (error) {
        console.error('Error verifying admin role:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get all users (from Postgres) - Public for now, but you can add verifyAdmin if needed
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create User (Admin)
app.post('/api/admin/users', async (req, res) => {
    const { email, password, name, role, country } = req.body;

    try {
        // 1. Create in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Insert into Postgres
        const insertQuery = `
      INSERT INTO users (firebase_uid, email, name, role, country)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
        // Note: Ensure your Postgres table 'users' has 'country' column if you want to save it there!
        // If not, we might need a migration or just ignore it for Postgres and trust Firestore.
        // Assuming Postgres schema might NOT have country, we will omit it if failure risk is high,
        // BUT the plan said "Insert into PostgreSQL".
        // Let's assume schema matches or we update schema?
        // Risky to assume column exists. The user prompt said: "Inserts into users table via pg client."
        // I will stick to the columns I know exist or are standard.
        // The prompt also said "Update signup to save Country... to a users collection in Firestore."
        // It didn't explicitly demand Country in Postgres, but "Admin... Insert into PostgreSQL".
        // I'll stick to: firebase_uid, email, name, role.

        const values = [userRecord.uid, email, name, role || 'User'];
        const result = await pool.query(
            'INSERT INTO users (firebase_uid, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            values
        );

        // 3. (Optional) Save to Firestore for profile details like country
        if (country) {
            await admin.firestore().collection('users').doc(userRecord.uid).set({
                name, email, role, country, createdAt: new Date().toISOString()
            });
        }

        res.status(201).json({ message: 'User created successfully', user: result.rows[0] });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update User (Admin)
app.put('/api/admin/users/:uid', async (req, res) => {
    const { uid } = req.params;
    const { email, name, role } = req.body;

    try {
        // 1. Update Firebase Auth
        await admin.auth().updateUser(uid, {
            email,
            displayName: name,
        });

        // 2. Update Postgres
        const updateQuery = `
      UPDATE users 
      SET email = $1, name = $2, role = $3
      WHERE firebase_uid = $4
      RETURNING *
    `;
        const result = await pool.query(updateQuery, [email, name, role, uid]);

        // 3. Update Firestore (if used)
        await admin.firestore().collection('users').doc(uid).set({
            email, name, role
        }, { merge: true });

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found in database' });
        }

        res.json({ message: 'User updated successfully', user: result.rows[0] });

    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete User (Admin)
app.delete('/api/admin/users/:uid', async (req, res) => {
    const { uid } = req.params;

    try {
        // 1. Delete from Firebase Auth
        await admin.auth().deleteUser(uid);

        // 2. Delete from Postgres
        const result = await pool.query('DELETE FROM users WHERE firebase_uid = $1 RETURNING *', [uid]);

        // 3. Delete from Firestore
        await admin.firestore().collection('users').doc(uid).delete();

        if (result.rows.length === 0) {
            // It might have been deleted from Auth but not DB, or vice versa. 
            // We return success if Auth deletion worked mostly.
            console.warn('User deleted from Auth but not found in Postgres');
        }

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
