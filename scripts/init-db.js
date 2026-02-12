import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from backend/.env (assuming script runs from root)
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
const envPath = path.join(backendDir, '.env');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    // Try loading from root .env if backend/.env doesn't exist
    dotenv.config({ path: path.join(rootDir, '.env') });
}

// Configuration
const dbHost = process.env.DB_HOST || 'localhost';
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME;

if (!dbUser || !dbName) {
    console.error('Error: DB_USER and DB_NAME environment variables are required.');
    console.log('Please ensure your .env file contains DB_USER and DB_NAME.');
    process.exit(1);
}

const dumpFile = path.join(backendDir, 'pubs_db_dump.sql');

if (!fs.existsSync(dumpFile)) {
    console.error(`Error: Dump file not found at ${dumpFile}`);
    console.log('Please run "npm run db:dump" locally first and upload the file.');
    process.exit(1);
}

// Try to find mysql client
const possiblePaths = [
    'mysql', // If in PATH (Linux/Plesk usually has this)
    'D:\\xampp\\mysql\\bin\\mysql.exe',
    'C:\\xampp\\mysql\\bin\\mysql.exe'
];

function checkCommand(cmd) {
    return new Promise((resolve) => {
        exec(`${cmd} --version`, (error) => {
            resolve(!error);
        });
    });
}

async function findMysql() {
    for (const p of possiblePaths) {
        if (p.includes('\\') && fs.existsSync(p)) {
            return p;
        } else if (!p.includes('\\') && await checkCommand(p)) {
            return p;
        }
    }
    return null;
}

console.log('Starting database import...');
console.log(`Target Database: ${dbName} @ ${dbHost}`);

findMysql().then((mysqlPath) => {
    if (!mysqlPath) {
        console.error('Error: mysql client not found. Please ensure mysql is installed or in your PATH.');
        process.exit(1);
    }

    console.log(`Using mysql client at: ${mysqlPath}`);

    const passwordPart = dbPassword ? `-p"${dbPassword}"` : '';
    // Construct command: mysql -h host -u user -pPASS dbname < file.sql
    const importCmd = `"${mysqlPath}" -h ${dbHost} -u ${dbUser} ${passwordPart} ${dbName} < "${dumpFile}"`;

    console.log('Importing data... (this might take a while)');
    
    exec(importCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error importing database: ${error.message}`);
            return;
        }
        console.log('Database imported successfully!');
    });
});
