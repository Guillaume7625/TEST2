# Changelog

Toutes les modifications notables du projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Versioning Sémantique](https://semver.org/lang/fr/).

## [2.0.0] - 2025-10-23

### ✨ Ajouté
- Architecture modulaire complète avec ES6 modules
- Script de build automatisé (`build.js`) pour embarquer le bundle en base64
- Suite de tests unitaires HTML pour la validation JSON
- Documentation consolidée dans `README_NEW.md`
- Guide de démarrage rapide (`QUICKSTART.md`)
- Fichiers d'exemples JSON (`example-simple.json`, `example-complete.json`)
- Fichier de configuration `config.json`
- Fichier `.gitignore` pour Git
- Fichier `package.json` avec scripts npm
- Script de validation du projet (`validate-project.sh`)
- Module `constants.js` : Constantes de layout et validation
- Module `utils.js` : Fonctions utilitaires réutilisables
- Module `validator.js` : Validation JSON complète
- Module `tableNormalizer.js` : Normalisation sécurisée des tableaux
- Module `slideCreators.js` : Création de slides par type
- Module `generator.js` : Génération PowerPoint progressive
- Module `pptxLoader.js` : Chargement robuste avec fallback
- Module `ui.js` : Gestion des interactions utilisateur
- Module `prompt.js` : Prompt optimal pour IA
- Module `app.js` : Point d'entrée principal
- Feedback progressif pendant la génération (slide X/Y)
- Gestion des avertissements non-bloquants

### 🔧 Modifié
- Refactorisation complète du code monolithique en modules
- Amélioration de la validation des tableaux (7 niveaux)
- Optimisation du loader PptxGenJS avec fallback multi-niveaux
- Amélioration des messages d'erreur (plus détaillés et contextuels)
- Séparation HTML, CSS et JavaScript pour meilleure maintenabilité
- Optimisation des performances avec micro-yields asynchrones

### 🐛 Corrigé
- Correction bug spread operator `.{` → `...` (4 occurrences)
- Correction échecs silencieux du chargement PptxGenJS
- Correction crash sur tableaux invalides (placeholder d'erreur)
- Correction freeze UI pendant génération longue
- Correction validation incomplète des tableaux

### 📚 Documentation
- Documentation consolidée en un seul README complet
- Ajout guide de démarrage rapide (3 minutes)
- Ajout section dépannage détaillée
- Ajout exemples de code pour extensions
- Archivage ancienne documentation dans `docs/`

### 🗂️ Structure
```
Ancien (v1.0):
- generateur_pptx_offline_v_final.html (1480 lignes monolithique)

Nouveau (v2.0):
- index.html (106 lignes)
- src/js/* (10 modules séparés)
- src/css/styles.css (feuille de style dédiée)
- build.js (script de build)
- test/* (tests unitaires)
- docs/* (documentation archivée)
```

### ⚡ Performances
- Réduction temps chargement initial
- Amélioration réactivité UI (micro-yields)
- Meilleure gestion mémoire (modules séparés)

### 🧪 Tests
- Ajout 8 tests unitaires pour validation
- Tests: JSON valide, metadata, slides, tableaux
- Interface de test HTML avec résultats colorés

---

## [1.0.0] - 2025-01-23

### ✨ Ajouté
- Génération PowerPoint hors-ligne complète
- Support 5 types de slides : title, content, twoColumn, table, image
- Validation JSON de base
- Interface utilisateur simple
- Prompt optimal V1 pour IA
- Support placeholders images
- Gestion basique des erreurs
- Documentation initiale (README, GUIDE_INTEGRATION, SYNTHESE)

### 🎯 Fonctionnalités
- Layout 16:9 automatique
- Validation structure JSON
- Génération .pptx locale
- Support UTF-8 et accents français
- Couleurs personnalisables (slides title)
- Tableaux jusqu'à 4 colonnes

### 📝 Documentation
- README.md initial
- GUIDE_INTEGRATION.md (guide ligne par ligne)
- SYNTHESE_CORRECTIFS.md (vue d'ensemble correctifs)
- PROMPT_OPTIMAL_V2.txt (template IA)

---

## Format des Versions

### [Major.Minor.Patch]

- **Major** : Changements incompatibles avec versions précédentes
- **Minor** : Ajout fonctionnalités rétro-compatibles
- **Patch** : Corrections de bugs rétro-compatibles

### Types de Changements

- **✨ Ajouté** : Nouvelles fonctionnalités
- **🔧 Modifié** : Changements fonctionnalités existantes
- **❌ Déprécié** : Fonctionnalités bientôt supprimées
- **🗑️ Supprimé** : Fonctionnalités retirées
- **🐛 Corrigé** : Corrections de bugs
- **🔒 Sécurité** : Corrections vulnérabilités

---

**Liens**:
- [2.0.0]: https://github.com/votreuser/powerpoint-generator/compare/v1.0.0...v2.0.0
- [1.0.0]: https://github.com/votreuser/powerpoint-generator/releases/tag/v1.0.0
