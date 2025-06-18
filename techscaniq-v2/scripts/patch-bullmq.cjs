const fs = require('fs');
const path = require('path');

// Path to the problematic file
const utilsPath = path.join(__dirname, '../node_modules/bullmq/dist/cjs/utils.js');

// Read the file
let content = fs.readFileSync(utilsPath, 'utf8');

// Check if semver is being imported correctly
if (!content.includes('const semver = require("semver");')) {
  console.log('Semver import not found in expected format');
} else {
  console.log('Found semver import, applying patches...');
  
  // First, replace the entire isRedisVersionLowerThan function with a safe version
  const functionStart = 'const isRedisVersionLowerThan = (currentVersion, minimumVersion) => {';
  const functionEnd = '};\nexports.isRedisVersionLowerThan = isRedisVersionLowerThan;';
  
  const startIndex = content.indexOf(functionStart);
  const endIndex = content.indexOf(functionEnd, startIndex) + functionEnd.length;
  
  if (startIndex !== -1 && endIndex !== -1) {
    const newFunction = `const isRedisVersionLowerThan = (currentVersion, minimumVersion) => {
    try {
        if (!semver || typeof semver.coerce !== 'function' || typeof semver.lt !== 'function') {
            console.warn('semver not properly loaded, assuming version is compatible');
            return false;
        }
        const version = semver.valid(semver.coerce(currentVersion));
        return semver.lt(version, minimumVersion);
    } catch (error) {
        console.warn('Error comparing Redis versions:', error.message);
        return false;
    }
};
exports.isRedisVersionLowerThan = isRedisVersionLowerThan;`;
    
    content = content.substring(0, startIndex) + newFunction + content.substring(endIndex);
    
    // Write the patched file
    fs.writeFileSync(utilsPath, content, 'utf8');
    console.log('✅ Patched BullMQ utils.js successfully');
    console.log('   - Fixed isRedisVersionLowerThan function');
    console.log('   - Added error handling for missing semver');
  } else {
    console.log('Could not find the isRedisVersionLowerThan function to patch');
  }
}

// Also check if we need to ensure semver is available
console.log('\nChecking semver availability...');
try {
  const semver = require('semver');
  console.log('✅ Semver is available');
  console.log(`   Version: ${semver.VERSION || 'unknown'}`);
  console.log(`   Has coerce: ${typeof semver.coerce === 'function' ? 'yes' : 'no'}`);
  console.log(`   Has lt: ${typeof semver.lt === 'function' ? 'yes' : 'no'}`);
} catch (e) {
  console.log('❌ Semver is not available:', e.message);
  console.log('\n⚠️  Installing semver...');
  const { execSync } = require('child_process');
  execSync('npm install semver', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ Semver installed');
}