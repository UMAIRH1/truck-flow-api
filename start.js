const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting TruckFlow Backend...\n');

// Run seed script first
console.log('📦 Running database seed...');
const seed = spawn('node', ['seed.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
});

seed.on('close', (code) => {
    if (code !== 0) {
        console.error('❌ Seed script failed');
        process.exit(1);
    }

    console.log('\n🌐 Starting server...\n');
    
    // Start the main server
    const server = spawn('node', ['src/index.js'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });

    server.on('close', (code) => {
        process.exit(code);
    });

    // Handle termination signals
    process.on('SIGTERM', () => {
        server.kill('SIGTERM');
    });

    process.on('SIGINT', () => {
        server.kill('SIGINT');
    });
});
