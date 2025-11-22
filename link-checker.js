#!/usr/bin/env node

/**
 * Wrapper to run the legacy static-site link checker from the repo root.
 * Keeps existing documentation commands (`node link-checker.js`) working.
 */
const { spawnSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'legacy-static-site', 'link-checker.js');
const result = spawnSync('node', [scriptPath], { stdio: 'inherit' });

process.exit(result.status ?? 1);
