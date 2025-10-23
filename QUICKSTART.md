# 🚀 Guide de Démarrage Rapide

## Installation en 3 Minutes

### Étape 1 : Télécharger le Bundle

```bash
# Télécharger pptxgen.bundle.js
wget https://github.com/gitbrent/PptxGenJS/releases/download/v3.12.0/pptxgen.bundle.js
```

### Étape 2 : Ouvrir l'Application

Double-cliquez sur `index.html` ou ouvrez-le dans votre navigateur.

### Étape 3 : Générer votre Première Présentation

1. Cliquez sur "📝 Afficher le Prompt Optimal"
2. Copiez le prompt et complétez les variables :
   - SUJET : "Innovation Digitale 2025"
   - AUDIENCE : "Direction Générale"
   - NOMBRE_SLIDES : 8
   - DURÉE_MINUTES : 15
   - STYLE : "professionnel"

3. Collez le prompt dans ChatGPT/Claude
4. Copiez le JSON généré
5. Collez-le dans la zone de texte de l'application
6. Cliquez sur "🚀 Générer PowerPoint"
7. Téléchargez votre présentation !

## Utiliser un Exemple

Pour tester rapidement, copiez le contenu de :
- `src/examples/example-simple.json` (présentation basique)
- `src/examples/example-complete.json` (exemple complet)

## Mode Build (Optionnel)

Pour créer une version autonome sans fichier externe :

```bash
npm install
npm run build
```

Le fichier `build/index.html` peut maintenant fonctionner seul, même sans `pptxgen.bundle.js` !

## Besoin d'Aide ?

- 📚 Documentation complète : `README_NEW.md`
- 🧪 Tests : Ouvrir `test/test-validator.html`
- 💡 Exemples : Dossier `src/examples/`
- 🐛 Problèmes : Section "Dépannage" dans README

## Raccourcis Clavier

- `Ctrl/Cmd + V` : Coller du JSON
- `Ctrl/Cmd + Enter` : Générer (après focus sur le bouton)
- `F12` : Ouvrir console pour debug

---

**Prêt à créer des présentations professionnelles ! 🎯**
