const path = require('path');
const { spawnSync } = require('child_process');

const runnerPath = path.resolve(__dirname, 'run-sql-folder.js');
const seedsPath = path.resolve(__dirname, '..', 'seeds');

const result = spawnSync(process.execPath, [runnerPath, seedsPath], {
    stdio: 'inherit',
    env: process.env,
});

process.exit(result.status ?? 1);
