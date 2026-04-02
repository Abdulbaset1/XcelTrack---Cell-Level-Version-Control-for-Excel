const path = require('path');
const { spawnSync } = require('child_process');

const runnerPath = path.resolve(__dirname, 'run-sql-folder.js');
const migrationsPath = path.resolve(__dirname, '..', 'migrations');

const result = spawnSync(process.execPath, [runnerPath, migrationsPath], {
    stdio: 'inherit',
    env: process.env,
});

process.exit(result.status ?? 1);
