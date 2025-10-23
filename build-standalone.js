#!/usr/bin/env node

/**
 * Build script for standalone version
 * Creates a self-contained ZIP file that works without a server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔨 Building Standalone PowerPoint Generator');
console.log('===========================================\n');

// Configuration
const CONFIG = {
  srcDir: './src',
  outputDir: './standalone',
  bundleFile: 'bundle.js',
  htmlFile: 'index.html',
  zipName: 'powerpoint-generator-v2.0-standalone.zip',
  modules: [
    'constants.js',
    'utils.js',
    'tableNormalizer.js',
    'validator.js',
    'slideCreators.js',
    'pptxLoader.js',
    'generator.js',
    'ui.js',
    'prompt.js',
    'app.js'
  ]
};

/**
 * Step 1: Clean and create output directory
 */
function setupOutputDirectory() {
  console.log('📁 Step 1: Setting up output directory...');
  
  // Remove existing standalone directory
  if (fs.existsSync(CONFIG.outputDir)) {
    fs.rmSync(CONFIG.outputDir, { recursive: true });
  }
  
  // Create fresh directory structure
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  fs.mkdirSync(path.join(CONFIG.outputDir, 'examples'), { recursive: true });
  
  console.log('✅ Output directory ready\n');
}

/**
 * Step 2: Read and process PptxGenJS bundle
 */
function getPptxGenBundle() {
  console.log('📦 Step 2: Loading PptxGenJS bundle...');
  
  const bundlePath = './pptxgen.cjs.js';
  
  if (!fs.existsSync(bundlePath)) {
    console.error('❌ Error: pptxgen.cjs.js not found!');
    console.log('   Please download it from: https://github.com/gitbrent/PptxGenJS/releases\n');
    process.exit(1);
  }
  
  const bundle = fs.readFileSync(bundlePath, 'utf8');
  console.log(`✅ PptxGenJS bundle loaded (${Math.round(bundle.length / 1024)} KB)\n`);
  
  return bundle;
}

/**
 * Step 3: Combine all JavaScript modules with PptxGenJS embedded
 */
function bundleModules(pptxgenCode) {
  console.log('🔗 Step 3: Bundling JavaScript modules with PptxGenJS...');
  
  let bundle = '';
  
  // CRITICAL: Wrap PptxGenJS CJS module to expose on window
  // pptxgen.cjs.js uses CommonJS and requires('jszip')
  // We need to provide mock CommonJS environment with JSZip
  bundle += '// ==========================================\n';
  bundle += '// PptxGenJS Library (CommonJS -> Browser)\n';
  bundle += '// ==========================================\n\n';
  
  // Step 1: Load JSZip first (from pptxgen.bundle.js which is actually JSZip)
  bundle += '// Load JSZip dependency\n';
  const jszipCode = fs.readFileSync('./pptxgen.bundle.js', 'utf8')
    .replace(/\/\/# sourceMappingURL=.*$/gm, '')
    .trim();
  bundle += jszipCode + '\n\n';
  
  // Step 1.5: Add default property to JSZip for CommonJS interop
  bundle += '// Add default property to JSZip constructor for proper interop\n';
  bundle += 'if (typeof JSZip !== "undefined") {\n';
  bundle += '  JSZip.default = JSZip;\n';
  bundle += '}\n\n';
  
  // Step 2: Remove sourcemap comment and CRLF line endings from PptxGenJS
  const cleanedPptxCode = pptxgenCode
    .replace(/\/\/# sourceMappingURL=.*$/gm, '')
    .replace(/\r\n/g, '\n')
    .trim();
  
  // Step 3: Wrap PptxGenJS in IIFE with mock require that returns JSZip
  bundle += '// Load PptxGenJS with JSZip dependency\n';
  bundle += 'var PptxGenJS = (function() {\n';
  bundle += '  var module = { exports: {} };\n';
  bundle += '  var exports = module.exports;\n';
  bundle += '  var require = function(name) {\n';
  bundle += '    if (name === "jszip") {\n';
  bundle += '      if (typeof window.JSZip !== "undefined") {\n';
  bundle += '        window.JSZip.default = window.JSZip;\n';
  bundle += '        return window.JSZip;\n';
  bundle += '      }\n';
  bundle += '      throw new Error("JSZip not found in global scope");\n';
  bundle += '    }\n';
  bundle += '    throw new Error("Module not found: " + name);\n';
  bundle += '  };\n\n';
  bundle += '  ' + cleanedPptxCode.replace(/\n/g, '\n  ') + '\n\n';
  bundle += '  return module.exports;\n';
  bundle += '})();\n\n';
  
  // Expose on window for browser access
  bundle += 'window.PptxGenJS = PptxGenJS;\n\n';
  
  // Verify it's a function
  bundle += 'if (typeof PptxGenJS !== "function") {\n';
  bundle += '  throw new Error("PptxGenJS failed to load: got " + typeof PptxGenJS);\n';
  bundle += '}\n\n';
  
  // THEN wrap our application code in IIFE
  bundle += '// ==========================================\n';
  bundle += '// Application Code (IIFE wrapper)\n';
  bundle += '// ==========================================\n\n';
  bundle += '(function() {\n';
  bundle += '  "use strict";\n\n';
  
  // No need to verify again - already checked at global level
  bundle += '  // PptxGenJS is now available at window.PptxGenJS\n\n';
  
  // Process each module (SKIP pptxLoader.js as it's not needed)
  const modulesToInclude = CONFIG.modules.filter(m => m !== 'pptxLoader.js');
  
  for (const moduleName of modulesToInclude) {
    const modulePath = path.join(CONFIG.srcDir, 'js', moduleName);
    
    if (!fs.existsSync(modulePath)) {
      console.warn(`⚠️  Warning: ${moduleName} not found, skipping...`);
      continue;
    }
    
    console.log(`   • Processing ${moduleName}...`);
    
    let moduleCode = fs.readFileSync(modulePath, 'utf8');
    
    // Remove ALL import statements (single and multiline)
    moduleCode = moduleCode.replace(/^import\s+[\s\S]*?from\s+['"][^'"]+['"];?\s*$/gm, '');
    moduleCode = moduleCode.replace(/^import\s+['"][^'"]+['"];?\s*$/gm, '');
    
    // Remove export keywords - ALL variations
    moduleCode = moduleCode.replace(/^export\s+function\s+/gm, 'function ');
    moduleCode = moduleCode.replace(/^export\s+const\s+/gm, 'const ');
    moduleCode = moduleCode.replace(/^export\s+class\s+/gm, 'class ');
    moduleCode = moduleCode.replace(/^export\s+async\s+function\s+/gm, 'async function ');
    moduleCode = moduleCode.replace(/^export\s+\{[^}]*\};?\s*$/gm, '');
    moduleCode = moduleCode.replace(/^export\s+default\s+/gm, '');
    
    // Remove loadPptxGenRobust function and calls (not needed in standalone)
    moduleCode = moduleCode.replace(/function\s+loadPptxGenRobust\s*\([^)]*\)\s*\{[\s\S]*?\n\}/gm, '');
    moduleCode = moduleCode.replace(/function\s+initializePptxGenPolling\s*\([^)]*\)\s*\{[\s\S]*?\n\}/gm, '');
    moduleCode = moduleCode.replace(/function\s+checkPptxGenAvailable\s*\([^)]*\)\s*\{[\s\S]*?\n\}/gm, '');
    moduleCode = moduleCode.replace(/loadPptxGenRobust\s*\([^)]*\)\s*;?/g, '');
    moduleCode = moduleCode.replace(/initializePptxGenPolling\s*\([^)]*\)\s*;?/g, '');
    
    // Replace checkPptxGenAvailable() calls with direct window.PptxGenJS access
    moduleCode = moduleCode.replace(/const\s+PptxGenJS\s*=\s*checkPptxGenAvailable\s*\(\s*\)\s*;?/g, 'const PptxGenJS = window.PptxGenJS;');
    moduleCode = moduleCode.replace(/let\s+PptxGenJS\s*=\s*checkPptxGenAvailable\s*\(\s*\)\s*;?/g, 'let PptxGenJS = window.PptxGenJS;');
    moduleCode = moduleCode.replace(/var\s+PptxGenJS\s*=\s*checkPptxGenAvailable\s*\(\s*\)\s*;?/g, 'var PptxGenJS = window.PptxGenJS;');
    // Generic pattern for any variable assignment
    moduleCode = moduleCode.replace(/(\w+)\s*=\s*checkPptxGenAvailable\s*\(\s*\)\s*;?/g, '$1 = window.PptxGenJS;');
    
    // Add module comment
    bundle += `  // ==========================================\n`;
    bundle += `  // Module: ${moduleName}\n`;
    bundle += `  // ==========================================\n\n`;
    bundle += moduleCode + '\n\n';
  }
  
  // Add global function exposure
  bundle += `  // ==========================================\n`;
  bundle += `  // Expose global functions\n`;
  bundle += `  // ==========================================\n\n`;
  bundle += `  window.generatePowerPoint = generatePowerPoint;\n`;
  bundle += `  window.togglePrompt = togglePrompt;\n`;
  bundle += `  window.copyPrompt = copyPrompt;\n`;
  bundle += `  window.toggleCollapsible = toggleCollapsible;\n\n`;
  
  // Add simple initialization (no loader needed, PptxGenJS already available)
  bundle += `  // ==========================================\n`;
  bundle += `  // Initialize on DOM ready\n`;
  bundle += `  // ==========================================\n\n`;
  bundle += `  if (document.readyState === 'loading') {\n`;
  bundle += `    document.addEventListener('DOMContentLoaded', function() {\n`;
  bundle += `      console.log('PowerPoint Generator initialized');\n`;
  bundle += `      console.log('PptxGenJS available:', typeof window.PptxGenJS === 'function');\n`;
  bundle += `    });\n`;
  bundle += `  } else {\n`;
  bundle += `    console.log('PowerPoint Generator initialized');\n`;
  bundle += `    console.log('PptxGenJS available:', typeof window.PptxGenJS === 'function');\n`;
  bundle += `  }\n\n`;
  
  // Close IIFE
  bundle += '})();\n';
  
  console.log('✅ Modules bundled successfully (with PptxGenJS embedded)\n');
  
  return bundle;
}

/**
 * Step 4: Create standalone HTML
 */
function createStandaloneHTML() {
  console.log('📄 Step 4: Creating standalone HTML...');
  
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Générateur PowerPoint Professionnel (Offline)</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🎯 Générateur PowerPoint Professionnel</h1>
      <p>Créez des présentations de qualité en quelques secondes — 100% hors‑ligne</p>
    </header>

    <div class="content">
      <div class="instructions">
        <h2>📋 Comment utiliser ce générateur</h2>
        <ol>
          <li><strong>Affichez et copiez</strong> le prompt optimal (bouton ci-dessous), renseignez vos variables (SUJET, AUDIENCE, ...).</li>
          <li><strong>Collez</strong> le JSON généré par l'IA dans la zone de texte.</li>
          <li><strong>Cliquez</strong> sur « Générer PowerPoint » pour obtenir le <code>.pptx</code>.</li>
        </ol>
      </div>

      <div class="section">
        <button class="btn" onclick="togglePrompt()">📝 Afficher le Prompt Optimal</button>
        <div id="promptBox" class="prompt-box" style="display:none;">
          <div class="section-title">Prompt à copier dans votre IA :</div>
          <textarea id="promptText" readonly></textarea>
          <button class="btn copy-btn" onclick="copyPrompt()">📋 Copier le Prompt</button>
          <div id="copyFeedback" role="status" aria-live="polite" data-default-message="✓ Prompt copié dans le presse‑papier !">✓ Prompt copié dans le presse‑papier !</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">📄 Collez ici le JSON généré par l'IA :</div>
        <textarea id="jsonInput" placeholder='Collez votre JSON ici...'></textarea>
      </div>

      <div class="section">
        <button id="generateBtn" class="btn btn-primary" onclick="generatePowerPoint()">
          <span id="genLabel">🚀 Générer PowerPoint</span>
          <span id="genSpin" style="display:none;" class="spinner"></span>
        </button>
      </div>

      <div id="error" class="alert alert-error" role="alert" aria-live="assertive"></div>
      <div id="success" class="alert alert-success" role="status" aria-live="polite"></div>
      <div id="warning" class="alert alert-warning" role="status" aria-live="polite"></div>

      <div class="collapsible">
        <div class="collapsible-header" onclick="toggleCollapsible(this)">
          <span>💡 Exemple JSON Minimal</span><span>▼</span>
        </div>
        <div class="collapsible-content">
          <div class="collapsible-body">
<pre>{
  "metadata": {
    "title": "Ma Présentation",
    "author": "Votre Nom",
    "company": "Votre Organisation",
    "fileName": "ma-presentation.pptx"
  },
  "slides": [
    {
      "type": "title",
      "title": "Titre Principal",
      "subtitle": "Sous-titre descriptif",
      "backgroundColor": "0066CC",
      "titleColor": "FFFFFF"
    },
    {
      "type": "content",
      "title": "Points Clés",
      "bullets": [
        "Définir l'objectif de la présentation",
        "Structurer le message en 3 points",
        "Clore avec un appel à l'action"
      ]
    }
  ]
}</pre>
          </div>
        </div>
      </div>

      <div class="collapsible">
        <div class="collapsible-header" onclick="toggleCollapsible(this)">
          <span>🔧 Types de Slides Supportés</span><span>▼</span>
        </div>
        <div class="collapsible-content">
          <div class="collapsible-body">
            <p><strong>1. title</strong> — Page de titre (obligatoirement la 1ʳᵉ slide)</p>
            <p><strong>2. content</strong> — Points (3 à 5 bullets, ≤ 15 mots chacun)</p>
            <p><strong>3. twoColumn</strong> — Deux colonnes (2 à 4 points par colonne)</p>
            <p><strong>4. table</strong> — Tableau (≤ 4 colonnes, ≤ 10 lignes)</p>
            <p><strong>5. image</strong> — Image <em>offline</em> (data URI <code>data:image/...</code>) ou placeholder <code>IMAGE_PLACEHOLDER_…</code></p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Application Bundle (includes PptxGenJS) -->
  <script src="bundle.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(CONFIG.outputDir, CONFIG.htmlFile), html, 'utf8');
  console.log('✅ Standalone HTML created\n');
}

/**
 * Step 5: Copy CSS
 */
function copyCSS() {
  console.log('🎨 Step 5: Copying CSS...');
  
  const cssPath = path.join(CONFIG.srcDir, 'css', 'styles.css');
  const destPath = path.join(CONFIG.outputDir, 'styles.css');
  
  if (fs.existsSync(cssPath)) {
    fs.copyFileSync(cssPath, destPath);
    console.log('✅ CSS copied\n');
  } else {
    console.warn('⚠️  Warning: styles.css not found\n');
  }
}

/**
 * Step 6: Copy examples
 */
function copyExamples() {
  console.log('📝 Step 6: Copying examples...');
  
  const examplesDir = path.join(CONFIG.srcDir, 'examples');
  const destDir = path.join(CONFIG.outputDir, 'examples');
  
  if (fs.existsSync(examplesDir)) {
    const files = fs.readdirSync(examplesDir);
    files.forEach(file => {
      if (file.endsWith('.json')) {
        fs.copyFileSync(
          path.join(examplesDir, file),
          path.join(destDir, file)
        );
        console.log(`   • ${file}`);
      }
    });
    console.log('✅ Examples copied\n');
  } else {
    console.warn('⚠️  Warning: examples directory not found\n');
  }
}

/**
 * Step 7: Create README
 */
function createREADME() {
  console.log('📚 Step 7: Creating README...');
  
  const readme = `GÉNÉRATEUR POWERPOINT PROFESSIONNEL v2.0
=========================================

🎯 UTILISATION RAPIDE
--------------------

1. Double-cliquez sur "index.html" pour ouvrir l'application
   (Fonctionne avec Chrome, Firefox, Safari, Edge)

2. Cliquez sur "Afficher le Prompt Optimal"

3. Copiez le prompt et remplissez les variables :
   - SUJET : votre sujet de présentation
   - AUDIENCE : votre public cible
   - NOMBRE_SLIDES : nombre de slides souhaité
   - DURÉE_MINUTES : durée de présentation
   - STYLE : professionnel/créatif/académique

4. Collez le prompt dans ChatGPT ou Claude

5. Copiez le JSON généré

6. Collez-le dans la zone de texte de l'application

7. Cliquez sur "Générer PowerPoint"

8. Téléchargez votre présentation .pptx !


📝 EXEMPLES INCLUS
-----------------

Consultez le dossier "examples/" pour des exemples de JSON :
- example-simple.json : Présentation basique
- example-complete.json : Exemple complet avec tous les types


🔧 TYPES DE SLIDES SUPPORTÉS
---------------------------

1. title     : Page de titre avec couleurs personnalisables
2. content   : Liste à puces (3-5 points)
3. twoColumn : Deux colonnes pour comparaison
4. table     : Tableaux (max 4 colonnes, 10 lignes)
5. image     : Images (data URI ou placeholders)


⚠️ RÈGLES IMPORTANTES
--------------------

• Première slide DOIT être type "title"
• Dernière slide DOIT être type "content"
• Titres : maximum 60 caractères
• Bullets : 3-5 par slide, 15 mots maximum chacun
• Tables : tous les nombres en chaînes ("45%" pas 45)
• Pas de guillemets typographiques « » " "


🐛 DÉPANNAGE
-----------

Problème : Rien ne se passe en cliquant sur "Générer"
→ Vérifiez que le JSON est valide (pas d'erreur de syntaxe)

Problème : Erreur "JSON invalide"
→ Assurez-vous de copier TOUT le JSON généré

Problème : Table affiche "ERREUR TABLE"
→ Vérifiez que tableData commence par une ligne d'en-têtes

Problème : Navigateur bloque le téléchargement
→ Autorisez les téléchargements pour cette page


💻 COMPATIBILITÉ
---------------

✅ Windows 10/11
✅ macOS 10.15+
✅ Linux (toutes distributions récentes)

✅ Chrome 90+
✅ Firefox 88+
✅ Safari 14+
✅ Edge 90+


📞 SUPPORT
---------

Pour des questions ou problèmes :
- Consultez la documentation complète dans le dossier principal
- Repository GitHub : https://github.com/Guillaume7625/TEST2


═══════════════════════════════════════════════════════════

Version : 2.0.0
Date    : 2025-10-23
Auteur  : Assistant IA Genspark
Licence : MIT

═══════════════════════════════════════════════════════════`;
  
  fs.writeFileSync(path.join(CONFIG.outputDir, 'README.txt'), readme, 'utf8');
  console.log('✅ README created\n');
}

/**
 * Step 8: Write bundle to file
 */
function writeBundle(bundle) {
  console.log('💾 Step 8: Writing bundle to file...');
  
  fs.writeFileSync(
    path.join(CONFIG.outputDir, CONFIG.bundleFile),
    bundle,
    'utf8'
  );
  
  const sizeKB = Math.round(bundle.length / 1024);
  console.log(`✅ Bundle written (${sizeKB} KB)\n`);
}

/**
 * Step 9: Create ZIP file
 */
function createZIP() {
  console.log('📦 Step 9: Creating ZIP file...');
  
  try {
    // Change to standalone directory and create zip
    process.chdir(CONFIG.outputDir);
    
    // Use different commands based on OS
    const isWindows = process.platform === 'win32';
    
    if (isWindows) {
      // Windows: Use PowerShell Compress-Archive
      execSync(
        `powershell -Command "Compress-Archive -Path * -DestinationPath ../${CONFIG.zipName} -Force"`,
        { stdio: 'inherit' }
      );
    } else {
      // Unix/Mac: Use zip command
      execSync(`zip -r ../${CONFIG.zipName} *`, { stdio: 'inherit' });
    }
    
    process.chdir('..');
    
    const zipPath = path.join(process.cwd(), CONFIG.zipName);
    const zipSizeKB = Math.round(fs.statSync(zipPath).size / 1024);
    
    console.log(`✅ ZIP created: ${CONFIG.zipName} (${zipSizeKB} KB)\n`);
  } catch (error) {
    console.error('❌ Error creating ZIP:', error.message);
    console.log('   You can manually zip the standalone/ directory\n');
  }
}

/**
 * Main build process
 */
function build() {
  try {
    setupOutputDirectory();
    const pptxBundle = getPptxGenBundle();
    const completeBundle = bundleModules(pptxBundle);
    createStandaloneHTML();
    copyCSS();
    copyExamples();
    createREADME();
    writeBundle(completeBundle);
    createZIP();
    
    console.log('═══════════════════════════════════════');
    console.log('✨ Standalone build completed!');
    console.log('═══════════════════════════════════════');
    console.log(`📦 ZIP file: ${CONFIG.zipName}`);
    console.log(`📁 Folder: ${CONFIG.outputDir}/`);
    console.log('🚀 Ready to distribute!\n');
    
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run build
build();
