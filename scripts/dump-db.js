import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Determine paths
const rootDir = path.resolve(__dirname, '..');
const backendDir = path.join(rootDir, 'backend');
// Create public folder if not exists
const publicDir = path.join(backendDir, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

// Ensure index.html exists in public
const indexHtml = path.join(publicDir, 'index.html');
if (!fs.existsSync(indexHtml)) {
    fs.writeFileSync(indexHtml, '<h1>API Server is Running</h1><p>Document root is set correctly.</p>');
}

const dumpFile = path.join(backendDir, 'pubs_db_dump.sql');

// Try to find mysqldump
const possiblePaths = [
    'mysqldump', // If in PATH
    'D:\\xampp\\mysql\\bin\\mysqldump.exe',
    'C:\\xampp\\mysql\\bin\\mysqldump.exe',
    'E:\\xampp\\mysql\\bin\\mysqldump.exe'
];

// Default XAMPP credentials
const dbUser = 'root';
const dbPassword = ''; // Empty by default in XAMPP
const dbName = 'pubs_db';
const dbHost = 'localhost';

function checkCommand(cmd) {
    return new Promise((resolve) => {
        exec(`${cmd} --version`, (error) => {
            resolve(!error);
        });
    });
}

async function findMysqldump() {
    for (const p of possiblePaths) {
        // For full paths, check if file exists first to avoid slow exec timeout
        if (p.includes('\\')) {
            if (fs.existsSync(p)) {
                return p;
            }
        } else {
            // Check PATH
            if (await checkCommand(p)) {
                return p;
            }
        }
    }
    return null;
}

console.log('Starting database dump...');

findMysqldump().then((mysqldumpPath) => {
    if (!mysqldumpPath) {
        console.warn('Warning: mysqldump not found. Please ensure XAMPP is installed or mysqldump is in your PATH.');
        console.log('Skipping database dump.');
        process.exit(0);
    }

    console.log(`Using mysqldump at: ${mysqldumpPath}`);

    // Construct command
    // Note: If password is empty, don't use -p
    const passwordPart = dbPassword ? `-p"${dbPassword}"` : '';
    // Use proper quoting for Windows paths
    const dumpCmd = `"${mysqldumpPath}" -h ${dbHost} -u ${dbUser} ${passwordPart} ${dbName} > "${dumpFile}"`;

    exec(dumpCmd, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error dumping database: ${error.message}`);
            // Don't fail build, just warn
            return;
        }
        console.log(`Database dumped successfully to: ${dumpFile}`);
    });
});
