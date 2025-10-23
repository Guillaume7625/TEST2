# Générateur PowerPoint Professionnel (Offline)

## Objectif du projet
Fournir une interface hors ligne, simple et fiable pour générer des présentations PowerPoint (`.pptx`) à partir d'un JSON structuré respectant des règles éditoriales strictes. L'application s'appuie sur la bibliothèque locale `pptxgen.bundle.js` et fonctionne entièrement sans connexion Internet.

## Fonctionnalités livrées
- Interface utilisateur guidée avec sections repliables (exemples, types de slides) et rappels d'utilisation directement dans la page.
- Prompt optimal V2 embarqué dans la balise `#optimalPromptV2`, synchronisé automatiquement avec la constante JavaScript et copiable via un bouton doté d'un fallback `execCommand` hors ligne.
- Validation JSON multicouche : structure générale, règles éditoriales (titres ≤ 60 caractères, bullets 3–5, colonnes 2–4…), contrôle des placeholders, vérification de `metadata.fileName` et normalisation sécurisée des tableaux (`normalizeTableDataSafe`).
- Génération PowerPoint progressive avec micro-pauses asynchrones, mise à jour du label de progression, gestion du spinner et panneau d'avertissements persistant.
- Chargeur PptxGenJS robuste : décodage base64 embarqué si disponible, fallback automatique vers `pptxgen.bundle.js`, messages bloquants explicites en cas d'absence et polling jusqu'au chargement effectif.
- Garde-fous avancés pour les tableaux : détection des incohérences, warnings ciblés, conversion sécurisée et slide de secours lisible lorsque la structure est irrécupérable.

## Points d'entrée fonctionnels
| URI locale | Description | Paramètres |
| --- | --- | --- |
| `generateur_pptx_offline_v_final.html` | Page unique de l'outil. À ouvrir directement depuis le système de fichiers ; le dépôt inclut déjà `pptxgen.bundle.js` dans le même dossier. | Aucun paramètre requis.

## Fonctionnalités non implémentées (à ce jour)
- Encapsulation automatique de `pptxgen.bundle.js` en base64 directement dans l'HTML pour produire un fichier totalement autonome.
- Prévisualisation directe des slides avant export.
- Import de fichiers JSON via glisser-déposer ou sélection de fichier.
- Génération de rapports détaillés sur les avertissements (export, archivage).
- Traduction de l'interface dans d'autres langues que le français.

## Prochaines étapes recommandées
1. Industrialiser un script de build qui encode `pptxgen.bundle.js` en base64 et remplace automatiquement l'espace réservé `<!--PPTX_BUNDLE_BASE64-->` pour livrer un unique fichier HTML.
2. Ajouter une sauvegarde/restauration locale du JSON (ex. `localStorage`) et la possibilité d'importer un fichier `.json`.
3. Proposer une prévisualisation HTML/CSS des slides validées avant génération du `.pptx`.
4. Mettre en place des tests automatisés (lint/validation JSON) pour sécuriser les futures évolutions.

## URLs publiques
- Aucune : l'application est conçue pour fonctionner hors ligne. Pour une mise en ligne éventuelle, utiliser l'outil de publication fourni par la plateforme.

## Modèles de données et stockage
- **Entrée principale** : objet JSON composé d'une section `metadata` (titres, auteur, fichier `.pptx`) et d'un tableau `slides` respectant les types `title`, `content`, `twoColumn`, `table`, `image`.
- **Stockage** : aucun stockage persistant. Le JSON est traité en mémoire côté navigateur.
- **Bibliothèques** : `pptxgen.bundle.js` (version 3.12.0 incluse) chargé via base64 embarqué ou, à défaut, via le fichier local pour générer le `.pptx`.

## Prérequis & mise en route hors ligne
1. Optionnel : remplacer l'espace réservé `<!--PPTX_BUNDLE_BASE64-->` par la version base64 de `pptxgen.bundle.js`. Si vous ne le faites pas, conservez `pptxgen.bundle.js` (fourni) au même niveau que `generateur_pptx_offline_v_final.html` pour le fallback automatique.
2. Ouvrir `generateur_pptx_offline_v_final.html` dans un navigateur moderne (Chrome, Edge, Firefox). Aucun serveur local n'est requis.
3. Utiliser le bouton « Afficher le Prompt Optimal », renseigner les variables, générer le JSON via votre IA, puis le coller dans la zone prévue avant de lancer la génération du `.pptx`.

Pour toute demande de publication en ligne, rendez-vous dans l'onglet **Publish** de la plateforme.
