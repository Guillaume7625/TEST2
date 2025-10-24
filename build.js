#!/usr/bin/env node

/**
 * Build script for PowerPoint Generator
 * Embeds pptxgen.bundle.js as base64 into HTML file
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  bundlePath: './pptxgen.bundle.js',
  htmlTemplate: './index.html',
  outputPath: './build/index.html',
  placeholder: '<!--PPTX_BUNDLE_BASE64-->'
};

console.log('🔨 PowerPoint Generator Build Tool');
console.log('==================================\n');

/**
 * Main build function
 */
async function build() {
  try {
    // Step 1: Check if bundle exists
    console.log('📦 Step 1: Checking for pptxgen.bundle.js...');
    if (!fs.existsSync(CONFIG.bundlePath)) {
      console.error(`❌ Error: ${CONFIG.bundlePath} not found!`);
      console.log('\n💡 Solutions:');
      console.log('   1. Download pptxgen.bundle.js from https://github.com/gitbrent/PptxGenJS/releases');
      console.log('   2. Place it in the project root directory');
      console.log('   3. Run this build script again\n');
      process.exit(1);
    }
    console.log('✅ Bundle found\n');
    
    // Step 2: Read bundle and encode to base64
    console.log('🔐 Step 2: Encoding bundle to base64...');
    const bundleContent = fs.readFileSync(CONFIG.bundlePath, 'utf8');
    const bundleBase64 = Buffer.from(bundleContent, 'utf8').toString('base64');
    const sizeKB = Math.round(bundleBase64.length / 1024);
    console.log(`✅ Encoded (${sizeKB} KB)\n`);
    
    // Step 3: Read HTML template
    console.log('📄 Step 3: Reading HTML template...');
    if (!fs.existsSync(CONFIG.htmlTemplate)) {
      console.error(`❌ Error: ${CONFIG.htmlTemplate} not found!`);
      process.exit(1);
    }
    let htmlContent = fs.readFileSync(CONFIG.htmlTemplate, 'utf8');
    console.log('✅ Template read\n');
    
    // Step 4: Replace placeholder
    console.log('🔄 Step 4: Replacing placeholder...');
    if (!htmlContent.includes(CONFIG.placeholder)) {
      console.error(`❌ Error: Placeholder "${CONFIG.placeholder}" not found in HTML template!`);
      process.exit(1);
    }
    htmlContent = htmlContent.replace(CONFIG.placeholder, bundleBase64);
    console.log('✅ Placeholder replaced\n');
    
    // Step 5: Ensure build directory exists
    console.log('📁 Step 5: Preparing build directory...');
    const buildDir = path.dirname(CONFIG.outputPath);
    if (!fs.existsSync(buildDir)) {
      fs.mkdirSync(buildDir, { recursive: true });
    }
    console.log('✅ Directory ready\n');
    
    // Step 6: Write output file
    console.log('💾 Step 6: Writing build output...');
    fs.writeFileSync(CONFIG.outputPath, htmlContent, 'utf8');
    const outputSizeKB = Math.round(fs.statSync(CONFIG.outputPath).size / 1024);
    console.log(`✅ File written: ${CONFIG.outputPath} (${outputSizeKB} KB)\n`);
    
    // Step 7: Copy dependencies
    console.log('📋 Step 7: Copying dependencies...');
    copyDirectory('./src', './build/src');
    console.log('✅ Dependencies copied\n');
    
    // Success summary
    console.log('═══════════════════════════════════');
    console.log('✨ Build completed successfully!');
    console.log('═══════════════════════════════════');
    console.log(`📦 Output: ${CONFIG.outputPath}`);
    console.log(`📊 Size: ${outputSizeKB} KB`);
    console.log(`🚀 Ready for offline use\n`);
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

/**
 * Copy directory recursively
 */
function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Run build
build();
