#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🚀 Starting Picture Repair App in development mode...\n');

// Start backend server
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: join(__dirname, 'server'),
  stdio: 'inherit',
  shell: true
});

// Wait a bit for backend to start
setTimeout(() => {
  console.log('🎨 Starting frontend development server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down development servers...');
    backend.kill();
    frontend.kill();
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backend.kill();
  });

  backend.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
    frontend.kill();
  });
}, 2000);

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
});