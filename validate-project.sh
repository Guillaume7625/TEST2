#!/bin/bash

echo "🔍 Validation du Projet PowerPoint Generator"
echo "=============================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Compteurs
PASSED=0
FAILED=0

# Fonction de test
test_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1 - MANQUANT"
        ((FAILED++))
    fi
}

test_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1/ - MANQUANT"
        ((FAILED++))
    fi
}

echo "📁 Structure de Dossiers"
echo "------------------------"
test_dir "src"
test_dir "src/js"
test_dir "src/css"
test_dir "src/examples"
test_dir "test"
test_dir "docs"
test_dir "build"
echo ""

echo "📄 Fichiers Principaux"
echo "----------------------"
test_file "index.html"
test_file "package.json"
test_file "build.js"
test_file "README_NEW.md"
test_file "QUICKSTART.md"
test_file "config.json"
test_file ".gitignore"
echo ""

echo "🎨 Fichiers CSS"
echo "---------------"
test_file "src/css/styles.css"
echo ""

echo "💻 Modules JavaScript"
echo "--------------------"
test_file "src/js/app.js"
test_file "src/js/constants.js"
test_file "src/js/utils.js"
test_file "src/js/validator.js"
test_file "src/js/tableNormalizer.js"
test_file "src/js/slideCreators.js"
test_file "src/js/generator.js"
test_file "src/js/pptxLoader.js"
test_file "src/js/ui.js"
test_file "src/js/prompt.js"
echo ""

echo "📝 Exemples JSON"
echo "----------------"
test_file "src/examples/example-simple.json"
test_file "src/examples/example-complete.json"
echo ""

echo "🧪 Tests"
echo "--------"
test_file "test/test-validator.html"
echo ""

echo "📚 Documentation Archivée"
echo "-------------------------"
test_file "docs/generateur_pptx_offline_v_final.html"
test_file "docs/fix-create-slides.js"
test_file "docs/generatePowerPoint-progressive.js"
test_file "docs/validation-tables-robust.js"
test_file "docs/loader-pptxgen-robust.js"
echo ""

# Vérifier pptxgen.bundle.js (optionnel)
echo "📦 Bibliothèque PptxGenJS"
echo "-------------------------"
if [ -f "pptxgen.bundle.js" ]; then
    SIZE=$(du -h pptxgen.bundle.js | cut -f1)
    echo -e "${GREEN}✓${NC} pptxgen.bundle.js (${SIZE})"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} pptxgen.bundle.js - Pas trouvé (optionnel, nécessaire pour mode non-build)"
fi
echo ""

# Résumé
echo "════════════════════════════════════════"
echo "Résumé"
echo "════════════════════════════════════════"
echo -e "${GREEN}✓ Passés${NC}  : $PASSED"
echo -e "${RED}✗ Échoués${NC} : $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ Validation réussie ! Projet prêt.${NC}"
    exit 0
else
    echo -e "${RED}❌ Validation échouée. Fichiers manquants.${NC}"
    exit 1
fi
