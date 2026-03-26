const { Client } = require('pg');
require('dotenv').config();

async function fix() {
    const commonConfig = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT || 5432,
    };

    const client = new Client({
        ...commonConfig,
        database: 'postgres', // Connect to default postgres database
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL (default db)');

        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'xceltrack'");

        if (res.rowCount === 0) {
            console.log('Database xceltrack does not exist. Creating...');
            await client.query('CREATE DATABASE xceltrack');
            console.log('Database xceltrack created successfully.');
        } else {
            console.log('Database xceltrack already exists.');
        }

        await client.end();

        // Now try to connect to xceltrack and verify tables
        const xtClient = new Client({
            ...commonConfig,
            database: 'xceltrack',
        });

        await xtClient.connect();
        console.log('Connected to xceltrack database.');

        // Check if users table exists
        const tableRes = await xtClient.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'users'
            );
        `);

        if (!tableRes.rows[0].exists) {
            console.log('Table users does not exist. You may need to run your migration script.');
            // Usually we'd run schema.sql here, but let's just warn for now.
        } else {
            console.log('Table users exists.');
        }

        await xtClient.end();
        console.log('Database check complete.');

    } catch (err) {
        console.error('Error fixing database:', err);
        process.exit(1);
    }
}

fix();
