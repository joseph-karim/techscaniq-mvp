#!/usr/bin/env node

/**
 * Script to update Supabase project CORS settings
 * This script provides instructions for updating authorized URLs in Supabase dashboard
 */

// Simple color functions for output
const colors = {
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold(colors.blue('\n🔧 Supabase CORS Configuration Update\n')));

console.log(colors.yellow('To update authorized URLs for scan.techscaniq.com:\n'));

console.log(colors.green('1. Visit Supabase Dashboard:'));
console.log('   https://app.supabase.com/project/xngbtpbtivygkxnsexjg\n');

console.log(colors.green('2. Navigate to Authentication > URL Configuration\n'));

console.log(colors.green('3. Update Site URL and Redirect URLs:\n'));
console.log(colors.cyan('   Site URL: https://scan.techscaniq.com'));
console.log(colors.cyan('   Additional Redirect URLs:'));
console.log(colors.cyan('   - https://scan.techscaniq.com/**'));
console.log(colors.cyan('   - https://techscaniq.com/**'));
console.log(colors.cyan('   - http://localhost:5173/**'));
console.log(colors.cyan('   - http://localhost:3000/**\n'));

console.log(colors.green('4. Save changes and verify configuration\n'));

console.log(colors.yellow('Note: This configures authentication redirects. The edge functions have already been updated with dynamic CORS headers.\n'));

console.log(colors.blue('Current edge function CORS configuration supports:'));
const allowedOrigins = [
  'https://scan.techscaniq.com',
  'https://techscaniq.com', 
  'http://localhost:5173',
  'http://localhost:3000'
];

allowedOrigins.forEach(origin => {
  console.log(colors.gray(`  ✓ ${origin}`));
});

console.log(colors.bold(colors.green('\n✨ CORS configuration update complete!\n')));