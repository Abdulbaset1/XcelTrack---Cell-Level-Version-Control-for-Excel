const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const admin = require('./firebaseAdmin');
const nodemailer = require('nodemailer');
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

// Email Configuration
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
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

// Create OTP table if it doesn't exist
pool.query(`
    CREATE TABLE IF NOT EXISTS otp_verifications (
        email VARCHAR(255) PRIMARY KEY,
        otp_code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP NOT NULL,
        attempts INT DEFAULT 0
    )
`).then(() => {
    console.log('OTP table ready');
}).catch(err => {
    console.error('Error creating OTP table:', err);
});

// --- OTP Endpoints ---

// Send OTP
app.post('/api/send-otp', async (req, res) => {
    const { email, name } = req.body;

    if (!email || !name) {
        return res.status(400).json({ error: 'Email and name are required' });
    }

    try {
        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

        // Delete any existing OTP for this email
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        // Store OTP in database
        await pool.query(
            'INSERT INTO otp_verifications (email, otp_code, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );

        // Send email
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'XcelTrack <noreply@xceltrack.com>',
            to: email,
            subject: 'Verify Your XcelTrack Account - OTP Code',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                        .otp-box { background: white; border: 2px solid #3b82f6; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }
                        .otp-code { font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #3b82f6; }
                        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
                        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to XcelTrack!</h1>
                        </div>
                        <div class="content">
                            <p>Hi <strong>${name}</strong>,</p>
                            <p>Thank you for signing up! To complete your registration, please verify your email address using the OTP code below:</p>
                            
                            <div class="otp-box">
                                <div style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Your OTP Code</div>
                                <div class="otp-code">${otp}</div>
                                <div style="color: #6b7280; font-size: 12px; margin-top: 10px;">Valid for 10 minutes</div>
                            </div>

                            <div class="warning">
                                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. XcelTrack will never ask for your OTP via phone or email.
                            </div>

                            <p>If you didn't request this code, please ignore this email.</p>
                            
                            <p>Best regards,<br><strong>The XcelTrack Team</strong></p>
                        </div>
                        <div class="footer">
                            <p>This is an automated message, please do not reply.</p>
                            <p>&copy; 2025 XcelTrack. All rights reserved.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };

        await transporter.sendMail(mailOptions);

        console.log(`OTP sent to ${email}: ${otp}`); // For development - remove in production
        res.json({ message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ error: 'Failed to send OTP. Please try again.' });
    }
});

// Verify OTP
app.post('/api/verify-otp', async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        // Get OTP record
        const result = await pool.query(
            'SELECT * FROM otp_verifications WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No OTP found for this email. Please request a new one.' });
        }

        const otpRecord = result.rows[0];

        // Check if OTP has expired
        if (new Date() > new Date(otpRecord.expires_at)) {
            await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
            return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
        }

        // Check attempt limit
        if (otpRecord.attempts >= 5) {
            await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);
            return res.status(429).json({ error: 'Too many failed attempts. Please request a new OTP.' });
        }

        // Verify OTP
        if (otpRecord.otp_code !== otp) {
            // Increment attempts
            await pool.query(
                'UPDATE otp_verifications SET attempts = attempts + 1 WHERE email = $1',
                [email]
            );
            return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
        }

        // OTP is valid! Delete it from database
        await pool.query('DELETE FROM otp_verifications WHERE email = $1', [email]);

        res.json({ message: 'OTP verified successfully' });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ error: 'Failed to verify OTP. Please try again.' });
    }
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
        const insertQuery = `
      INSERT INTO users (firebase_uid, email, name, role)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
        const values = [uid, email, name, 'user'];
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

// Get all users (from Postgres)
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
    const { email, password, name, role } = req.body;

    try {
        // 1. Create in Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Insert into Postgres
        const values = [userRecord.uid, email, name, role || 'user'];
        const result = await pool.query(
            'INSERT INTO users (firebase_uid, email, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
            values
        );

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

        if (result.rows.length === 0) {
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
