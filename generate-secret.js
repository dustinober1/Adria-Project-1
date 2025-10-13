#!/usr/bin/env node

// Generate a secure random JWT secret
const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');

console.log('\n🔐 Generated Secure JWT Secret:\n');
console.log(secret);
console.log('\n📝 Add this to your .env file as JWT_SECRET:\n');
console.log(`JWT_SECRET=${secret}\n`);
