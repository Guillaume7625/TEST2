#!/usr/bin/env node

/**
 * Build script for MINIMAL standalone PowerPoint Generator
 * Creates a single-file distribution ready for offline use
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building MINIMAL Standalone PowerPoint Generator');
console.log('===========================================\n');

// Paths
const ROOT = __dirname;
const OUTPUT_DIR = path.join(ROOT, 'standalone-minimal');
const SRC_DIR = path.join(ROOT, 'src');
const PPTX_BUNDLE_PATH = path.join(ROOT, 'pptxgen.bundle.js');

// Step 1: Setup output directory
console.log('📁 Step 1: Setting up output directory...');
if (fs.existsSync(OUTPUT_DIR)) {
  fs.rmSync(OUTPUT_DIR, { recursive: true });
}
fs.mkdirSync(OUTPUT_DIR, { recursive: true });
console.log('✅ Output directory ready\n');

// Step 2: Load PptxGenJS
console.log('📦 Step 2: Loading PptxGenJS bundle...');
if (!fs.existsSync(PPTX_BUNDLE_PATH)) {
  console.error('❌ ERROR: pptxgen.bundle.js not found!');
  console.error('Please download it from: https://github.com/gitbrent/PptxGenJS/releases');
  console.error('And place it in the root directory.');
  process.exit(1);
}
const pptxBundle = fs.readFileSync(PPTX_BUNDLE_PATH, 'utf8');
const pptxSize = (Buffer.byteLength(pptxBundle) / 1024).toFixed(0);
console.log(`✅ PptxGenJS bundle loaded (${pptxSize} KB)\n`);

// Step 3: Bundle JavaScript modules
console.log('🔗 Step 3: Bundling JavaScript modules with PptxGenJS...');

const modules = [
  'constants.js',
  'utils.js',
  'tableNormalizer.js',
  'validator.js',
  'slideCreators.js',
  'generator.js',
  'ui.js',
  'prompt.js',
  'app.js'
];

let bundledCode = '';

// Add PptxGenJS first (in global scope)
bundledCode += `// PptxGenJS Library\n`;
bundledCode += pptxBundle + '\n\n';

// Add application code wrapped in IIFE
bundledCode += `// Application Code\n`;
bundledCode += `(function() {\n`;
bundledCode += `  'use strict';\n\n`;

// Check PptxGenJS availability
bundledCode += `  // Verify PptxGenJS is available\n`;
bundledCode += `  if (typeof window.PptxGenJS === 'undefined') {\n`;
bundledCode += `    console.error('❌ PptxGenJS not available');\n`;
bundledCode += `    alert('Erreur: Bibliothèque PptxGenJS non chargée. Rechargez la page.');\n`;
bundledCode += `    throw new Error('PptxGenJS library not loaded');\n`;
bundledCode += `  }\n`;
bundledCode += `  console.log('✅ PptxGenJS loaded successfully');\n\n`;

// Process each module
modules.forEach(moduleName => {
  const modulePath = path.join(SRC_DIR, 'js', moduleName);
  console.log(`   • Processing ${moduleName}...`);
  
  let moduleCode = fs.readFileSync(modulePath, 'utf8');
  
  // Remove import statements
  moduleCode = moduleCode.replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '');
  moduleCode = moduleCode.replace(/^import\s+['"].*?['"];?\s*$/gm, '');
  
  // Remove export statements but keep the declarations
  moduleCode = moduleCode.replace(/^export\s+/gm, '');
  
  // Replace checkPptxGenAvailable() with window.PptxGenJS
  moduleCode = moduleCode.replace(/const\s+PptxGenJS\s*=\s*checkPptxGenAvailable\(\);?/g, 'const PptxGenJS = window.PptxGenJS;');
  moduleCode = moduleCode.replace(/let\s+PptxGenJS\s*=\s*checkPptxGenAvailable\(\);?/g, 'let PptxGenJS = window.PptxGenJS;');
  moduleCode = moduleCode.replace(/var\s+PptxGenJS\s*=\s*checkPptxGenAvailable\(\);?/g, 'var PptxGenJS = window.PptxGenJS;');
  
  bundledCode += `  // Module: ${moduleName}\n`;
  bundledCode += moduleCode + '\n\n';
});

// Expose functions globally for onclick handlers
bundledCode += `  // Expose functions globally\n`;
bundledCode += `  window.generatePowerPoint = generatePowerPoint;\n`;
bundledCode += `  window.validateJSONOnly = validateJSONOnly;\n`;
bundledCode += `  window.togglePrompt = togglePrompt;\n`;
bundledCode += `  window.copyPrompt = copyPrompt;\n`;
bundledCode += `  window.toggleCollapsible = toggleCollapsible;\n\n`;

bundledCode += `  console.log('✅ Application initialized');\n`;
bundledCode += `})();\n`;

console.log('✅ Modules bundled successfully (with PptxGenJS embedded)\n');

// Step 4: Create standalone HTML
console.log('📄 Step 4: Creating standalone HTML...');
let html = fs.readFileSync(path.join(ROOT, 'index-minimal.html'), 'utf8');
html = html.replace(
  '<script type="module" src="./src/js/app.js"></script>',
  '<script src="./bundle.js"></script>'
);
html = html.replace(
  '<link rel="stylesheet" href="./src/css/styles-minimal.css">',
  '<link rel="stylesheet" href="./styles.css">'
);
// Remove PptxGenJS bundle data script tag (not needed in standalone)
html = html.replace(/<script id="pptxgen-bundle-data".*?<\/script>/s, '');

fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
console.log('✅ Standalone HTML created\n');

// Step 5: Copy CSS
console.log('🎨 Step 5: Copying CSS...');
fs.copyFileSync(
  path.join(SRC_DIR, 'css', 'styles-minimal.css'),
  path.join(OUTPUT_DIR, 'styles.css')
);
console.log('✅ CSS copied\n');

// Step 6: Create README
console.log('📚 Step 6: Creating README...');
const readme = `PowerPoint Generator - Minimal Version v2.2
============================================

ULTRA-SIMPLE OFFLINE POWERPOINT GENERATOR

🎯 Features:
- 3-step interface: Prompt → JSON → Generate
- 100% offline (no internet required)
- Clean, modern design
- Professional output

📖 How to Use:
1. Double-click index.html
2. Copy the prompt (button "Copier")
3. Use the prompt with any AI (ChatGPT, Claude, etc.)
4. Paste generated JSON
5. Click "Générer PowerPoint"

📦 Files:
- index.html    : Main application
- styles.css    : Styling
- bundle.js     : Application + PptxGenJS library
- README.txt    : This file

⚠️ Requirements:
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No internet connection needed

🔧 Troubleshooting:
- If nothing happens: Check browser console (F12)
- If errors appear: Ensure JSON is valid
- For help: https://github.com/Guillaume7625/TEST2

Version: 2.2 (Minimal)
Last updated: ${new Date().toISOString().split('T')[0]}
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'README.txt'), readme);
console.log('✅ README created\n');

// Step 7: Write bundle
console.log('💾 Step 7: Writing bundle to file...');
const bundleSize = (Buffer.byteLength(bundledCode) / 1024).toFixed(0);
fs.writeFileSync(path.join(OUTPUT_DIR, 'bundle.js'), bundledCode);
console.log(`✅ Bundle written (${bundleSize} KB)\n`);

// Step 8: Create ZIP
console.log('📦 Step 8: Creating ZIP file...');
const zipName = 'powerpoint-generator-minimal-v2.2.zip';
const zipPath = path.join(ROOT, zipName);

if (fs.existsSync(zipPath)) {
  fs.unlinkSync(zipPath);
}

try {
  execSync(`cd "${OUTPUT_DIR}" && zip -r "../${zipName}" .`, { stdio: 'inherit' });
  const zipStats = fs.statSync(zipPath);
  const zipSize = (zipStats.size / 1024).toFixed(0);
  console.log(`✅ ZIP created: ${zipName} (${zipSize} KB)\n`);
} catch (error) {
  console.error('❌ Failed to create ZIP file');
  console.error('Please create it manually from the standalone-minimal/ directory');
}

// Summary
console.log('═══════════════════════════════════════');
console.log('✨ Minimal Standalone build completed!');
console.log('═══════════════════════════════════════');
console.log(`📦 ZIP file: ${zipName}`);
console.log(`📁 Folder: ./standalone-minimal/`);
console.log('🚀 Ready to distribute!\n');
