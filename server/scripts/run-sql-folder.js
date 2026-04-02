const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runSqlFolder(folderPath) {
    const absoluteFolder = path.resolve(folderPath);
    const files = fs.readdirSync(absoluteFolder)
        .filter((name) => name.endsWith('.sql'))
        .sort();

    if (files.length === 0) {
        console.log(`No SQL files found in ${absoluteFolder}`);
        return;
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const file of files) {
            const sql = fs.readFileSync(path.join(absoluteFolder, file), 'utf8');
            if (!sql.trim()) continue;
            console.log(`Running ${file}...`);
            await client.query(sql);
        }
        await client.query('COMMIT');
        console.log('SQL execution completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('SQL execution failed:', error.message);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
}

const targetFolder = process.argv[2];
if (!targetFolder) {
    console.error('Usage: node scripts/run-sql-folder.js <folder-path>');
    process.exit(1);
}

runSqlFolder(targetFolder);
