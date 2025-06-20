#!/usr/bin/env node
const { startServer } = require('./src/api/server');

console.log('🚀 Starting TechScanIQ LangGraph API Server...');
startServer();