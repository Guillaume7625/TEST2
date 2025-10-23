# 🔧 Guide d'Intégration des Correctifs v2.0

## Vue d'ensemble

Ce guide explique comment intégrer les 4 correctifs critiques + le prompt amélioré dans votre générateur PowerPoint.

---

## 🎯 **Priorité 1 : Loader PptxGenJS Robuste**

### Fichier concerné
`generateur_pptx_offline_v_final.html` (lignes 8-23)

### Remplacement

**AVANT (lignes 8-23) :**
```html
<script id="pptxgen-bundle-data" type="application/octet-stream"><!--PPTX_BUNDLE_BASE64--></script>
<script>
  (function loadPptxGen() {
    const container = document.getElementById('pptxgen-bundle-data');
    if (!container) return;
    const base64 = container.textContent.replace(/\s+/g, '');
    const scriptEl = document.createElement('script');
    scriptEl.type = 'text/javascript';
    scriptEl.textContent = atob(base64);
    document.head.appendChild(scriptEl);
  })();
</script>
```

**APRÈS :**
```html
<script id="pptxgen-bundle-data" type="application/octet-stream"><!--PPTX_BUNDLE_BASE64--></script>
<script>
  (function loadPptxGenRobust() {
    const container = document.getElementById('pptxgen-bundle-data');
    
    // NIVEAU 1 : Tentative chargement depuis base64 embarqué
    if (container) {
      const base64 = container.textContent.replace(/\s+/g, '');
      
      if (base64 && 
          base64 !== '<!--PPTX_BUNDLE_BASE64-->' && 
          base64.length > 10000) {
        try {
          const scriptEl = document.createElement('script');
          scriptEl.type = 'text/javascript';
          scriptEl.textContent = atob(base64);
          document.head.appendChild(scriptEl);
          console.info('✓ PptxGenJS chargé depuis base64 embarqué');
          return;
        } catch (err) {
          console.warn('⚠️ Échec décodage base64, tentative fallback...', err);
        }
      } else {
        console.warn('⚠️ Base64 manquant/invalide, tentative fallback...');
      }
    }

    // NIVEAU 2 : Fallback vers fichier externe
    const fallbackScript = document.createElement('script');
    fallbackScript.src = './pptxgen.bundle.js';
    fallbackScript.onerror = () => {
      console.error('❌ Échec chargement pptxgen.bundle.js externe');
      showCriticalError();
    };
    fallbackScript.onload = () => {
      console.info('✓ PptxGenJS chargé depuis fichier externe (fallback)');
    };
    document.head.appendChild(fallbackScript);

    function showCriticalError() {
      document.body.innerHTML = `
        <div style="position:fixed;top:0;left:0;right:0;bottom:0;background:linear-gradient(135deg,#fc8181 0%,#c53030 100%);color:white;display:flex;align-items:center;justify-content:center;font-family:system-ui;padding:40px;z-index:9999;">
          <div style="max-width:600px;text-align:center;">
            <div style="font-size:72px;margin-bottom:20px;">⚠️</div>
            <h1 style="font-size:28px;margin:0 0 16px;font-weight:700;">Erreur Critique : Bibliothèque Manquante</h1>
            <p style="font-size:18px;line-height:1.6;margin:0 0 24px;opacity:0.95;">
              La bibliothèque <code style="background:rgba(0,0,0,0.3);padding:2px 8px;border-radius:4px;">pptxgen.bundle.js</code> n'a pas pu être chargée.
            </p>
            <div style="background:rgba(0,0,0,0.2);padding:20px;border-radius:8px;text-align:left;font-size:14px;">
              <strong>Solutions :</strong><br>
              1. Vérifiez que pptxgen.bundle.js est dans le même dossier<br>
              2. Si version embarquée, vérifiez le placeholder base64<br>
              3. Ouvrez la console (F12) pour détails
            </div>
          </div>
        </div>`;
    }
  })();
</script>
```

### Ajout dans generatePowerPoint()

**Au début de la fonction (ligne ~512 après `let warningsToDisplay = [];`) :**
```javascript
try {
  // AJOUT : Vérification PptxGenJS disponible
  if (typeof window.PptxGenJS === 'undefined' && typeof window.pptxgen === 'undefined') {
    throw new Error(
      'PptxGenJS n\'est pas disponible.\n' +
      'Vérifiez que pptxgen.bundle.js est correctement chargé.\n' +
      'Rechargez la page ou consultez la console.'
    );
  }
  const PptxGenJS = window.PptxGenJS || window.pptxgen;
  
  const jsonInput = document.getElementById('jsonInput').value.trim();
  // ... reste du code ...
```

---

## 🎯 **Priorité 2 : Correction Bugs Spread Operator**

### Fichiers concernés
`generateur_pptx_offline_v_final.html` (lignes ~370-480)

### Remplacements

**1. createContentSlide (ligne ~385)**
```javascript
// AVANT
slide.addText(data.title, { .{ZONES.title}, fontSize: 32, bold: true, color: '0066cc' });

// APRÈS
slide.addText(data.title, { ...ZONES.title, fontSize: 32, bold: true, color: '0066cc' });
```

**2. createTwoColumnSlide (ligne ~395)**
```javascript
// AVANT
slide.addText(data.title, { .{ZONES.title}, fontSize: 32, bold: true, color: '0066cc' });

// APRÈS
slide.addText(data.title, { ...ZONES.title, fontSize: 32, bold: true, color: '0066cc' });
```

**3. createTableSlide (ligne ~410)**
```javascript
// AVANT
slide.addText(data.title, { .{ZONES.title}, fontSize: 32, bold: true, color: '0066cc' });

// APRÈS
slide.addText(data.title, { ...ZONES.title, fontSize: 32, bold: true, color: '0066cc' });
```

**4. createImageSlide (ligne ~440)**
```javascript
// AVANT
slide.addText(data.title, { .{ZONES.title}, fontSize: 32, bold: true, color: '0066cc' });

// APRÈS
slide.addText(data.title, { ...ZONES.title, fontSize: 32, bold: true, color: '0066cc' });
```

### ⚠️ CRITIQUE
Ces erreurs de syntaxe `.{` au lieu de `...` causent des **erreurs JavaScript immédiates** empêchant toute génération.

---

## 🎯 **Priorité 3 : Validation Tables Renforcée**

### Fichier concerné
`generateur_pptx_offline_v_final.html` (lignes ~250-280 dans validateJSON)

### Remplacement section "case 'table':"

**Remplacer tout le bloc `case 'table':` (lignes ~258-280) par :**

```javascript
case 'table': {
  // Validation titre
  if (!isNonEmptyString(slide.title)) {
    errors.push(`Slide ${n} : propriété 'title' manquante ou vide`);
  } else if (slide.title.trim().length > TITLE_MAX_LENGTH) {
    errors.push(`Slide ${n} : titre > ${TITLE_MAX_LENGTH} caractères (actuel: ${slide.title.trim().length})`);
  }
  
  // NIVEAU 1 : Existence et type
  if (!slide.tableData) {
    errors.push(`Slide ${n} (table) : propriété 'tableData' manquante`);
    break;
  }
  
  if (!Array.isArray(slide.tableData)) {
    errors.push(`Slide ${n} (table) : 'tableData' doit être un tableau (type: ${typeof slide.tableData})`);
    break;
  }
  
  // NIVEAU 2 : Non vide
  if (slide.tableData.length === 0) {
    errors.push(`Slide ${n} (table) : 'tableData' ne peut pas être vide`);
    break;
  }
  
  // NIVEAU 3 : En-têtes valides (CRITIQUE)
  const header = slide.tableData[0];
  
  if (!Array.isArray(header)) {
    errors.push(`Slide ${n} (table) : première ligne (en-têtes) doit être un tableau (type: ${typeof header})`);
    break;
  }
  
  if (header.length === 0) {
    errors.push(`Slide ${n} (table) : ligne d'en-têtes ne peut pas être vide`);
    break;
  }
  
  // NIVEAU 4 : Contenu en-têtes
  let hasInvalidHeaders = false;
  header.forEach((cell, idx) => {
    const cellText = typeof cell === 'object' && cell !== null ? cell.text : cell;
    if (!isNonEmptyString(cellText)) {
      errors.push(`Slide ${n} (table) : en-tête colonne ${idx + 1} doit être une chaîne non vide`);
      hasInvalidHeaders = true;
    }
  });
  
  if (hasInvalidHeaders) break;
  
  // NIVEAU 5 : Contraintes dimensionnelles
  const colCount = header.length;
  
  if (colCount > 4) {
    errors.push(`Slide ${n} (table) : max 4 colonnes (actuel: ${colCount})`);
  }
  
  if (slide.tableData.length > 10) {
    errors.push(`Slide ${n} (table) : max 10 lignes (actuel: ${slide.tableData.length})`);
  }
  
  // NIVEAU 6 : Cohérence lignes
  slide.tableData.slice(1).forEach((row, idx) => {
    const rowNum = idx + 2;
    
    if (!Array.isArray(row)) {
      errors.push(`Slide ${n} (table) ligne ${rowNum} : doit être un tableau (type: ${typeof row})`);
      return;
    }
    
    if (row.length !== colCount) {
      warns.push(`Slide ${n} (table) ligne ${rowNum} : ${row.length} cellules vs ${colCount} en-têtes`);
    }
    
    row.forEach((cell, cellIdx) => {
      if (cell === null || cell === undefined) {
        warns.push(`Slide ${n} (table) ligne ${rowNum} colonne ${cellIdx + 1} : cellule vide/null`);
      }
    });
  });
  
  // NIVEAU 7 : Pré-normalisation sécurisée
  try {
    slide._normalizedTableData = normalizeTableData(slide.tableData);
  } catch (normError) {
    errors.push(`Slide ${n} (table) : échec normalisation - ${normError.message}`);
  }
  
  break;
}
```

### Remplacement fonction normalizeTableData

**Remplacer la fonction complète (lignes ~155-170) par :**

```javascript
function normalizeTableData(rows) {
  // Triple vérification
  if (!Array.isArray(rows) || rows.length === 0 || 
      !Array.isArray(rows[0]) || rows[0].length === 0) {
    console.error('Table invalide:', rows);
    return [[{
      text: 'ERREUR TABLE',
      options: { bold: true, fill: 'FC8181', color: 'FFFFFF' }
    }]];
  }
  
  return rows.map((row, idxRow) => {
    if (!Array.isArray(row)) {
      console.warn(`Ligne ${idxRow} non-tableau, conversion forcée`);
      return [{ text: String(row), options: {} }];
    }
    
    return row.map(cell => {
      if (cell && typeof cell === 'object' && 'text' in cell) {
        return {
          text: String(cell.text ?? ''),
          options: cell.options || (idxRow === 0 ? { bold: true, fill: 'E1E1E1', color: '000000' } : {})
        };
      }
      
      let textValue;
      if (cell === null || cell === undefined) {
        textValue = '';
      } else if (typeof cell === 'object') {
        textValue = JSON.stringify(cell);
      } else {
        textValue = String(cell);
      }
      
      return {
        text: textValue,
        options: idxRow === 0 ? { bold: true, fill: 'E1E1E1', color: '000000' } : {}
      };
    });
  });
}
```

### Mise à jour createTableSlide

**Remplacer le début de createTableSlide (lignes ~410-425) par :**

```javascript
function createTableSlide(slide, data) {
  slide.addText(data.title, { ...ZONES.title, fontSize: 32, bold: true, color: '0066cc' });
  
  const sourceTable = data._normalizedTableData || data.tableData;
  
  // Validation stricte avant rendu
  if (!Array.isArray(sourceTable) || sourceTable.length === 0 || 
      !Array.isArray(sourceTable[0]) || sourceTable[0].length === 0) {
    
    slide.addText('⚠️ Tableau indisponible\n\nStructure de données invalide.\nVérifiez que tableData commence par un tableau d\'en-têtes non vide.', {
      x: ZONES.content.x,
      y: ZONES.content.y,
      w: ZONES.content.w,
      h: ZONES.content.h,
      fontSize: 18,
      color: 'C53030',
      align: 'center',
      valign: 'middle',
      fill: 'FFF5F5',
      border: { pt: 2, color: 'FC8181', type: 'dash' }
    });
    return;
  }
  
  const tableData = normalizeTableData(sourceTable);
  
  // ... reste du code existant ...
```

---

## 🎯 **Priorité 4 : Feedback Progressif**

### Fichier concerné
`generateur_pptx_offline_v_final.html` (lignes ~510-570 dans generatePowerPoint)

### Remplacement boucle création slides

**AVANT (ligne ~545) :**
```javascript
// Slides
data.slides.forEach((s, idx) => {
  const slide = pptx.addSlide();
  switch (s.type) {
    case 'title': createTitleSlide(slide, s); break;
    case 'content': createContentSlide(slide, s); break;
    case 'twoColumn': createTwoColumnSlide(slide, s); break;
    case 'table': createTableSlide(slide, s); break;
    case 'image': createImageSlide(slide, s); break;
    default: throw new Error(`Type de slide inconnu à l'index ${idx}`);
  }
});
```

**APRÈS :**
```javascript
// Slides avec feedback progressif
const totalSlides = data.slides.length;

for (let i = 0; i < totalSlides; i++) {
  const slideData = data.slides[i];
  
  // Mise à jour label progression
  label.textContent = `Génération slide ${i + 1}/${totalSlides}...`;
  
  // Micro-yield : laisse le navigateur peindre l'UI
  await new Promise(resolve => setTimeout(resolve, 0));
  
  const slide = pptx.addSlide();
  
  switch (slideData.type) {
    case 'title': 
      createTitleSlide(slide, slideData); 
      break;
    case 'content': 
      createContentSlide(slide, slideData); 
      break;
    case 'twoColumn': 
      createTwoColumnSlide(slide, slideData); 
      break;
    case 'table': 
      createTableSlide(slide, slideData); 
      break;
    case 'image': 
      createImageSlide(slide, slideData); 
      break;
    default: 
      throw new Error(`Type de slide inconnu à l'index ${i}: "${slideData.type}"`);
  }
}
```

**Ajout avant export (ligne ~560) :**
```javascript
// Export final
label.textContent = 'Finalisation du fichier...';
await new Promise(resolve => setTimeout(resolve, 0)); // Dernier yield

const fileName = data.metadata.fileName || `presentation-${Date.now()}.pptx`;
await pptx.writeFile({ fileName });
```

---

## 🎯 **Priorité 5 : Prompt Amélioré**

### Fichier concerné
`generateur_pptx_offline_v_final.html` (lignes ~600-fin dans `const OPTIMAL_PROMPT`)

### Remplacement

**Remplacer toute la chaîne `const OPTIMAL_PROMPT = \`...\`;` par le contenu de :**
`PROMPT_OPTIMAL_V2.txt` (fourni séparément)

**Principaux ajouts :**
- Section "CAS SPÉCIAUX À GÉRER IMPÉRATIVEMENT" avec 4 points détaillés
- Garde-fous explicites : guillemets typographiques, nombres en strings, validation JSON
- Exemples CORRECT vs INCORRECT pour chaque cas limite
- Checklist validation finale étendue à 15 points

---

## 📋 **Checklist Complète d'Intégration**

```
□ 1. Loader robuste intégré (lignes 8-60)
□ 2. checkPptxGenAvailable ajouté dans generatePowerPoint
□ 3. Tous les .{ZONES.xxx} corrigés en ...ZONES.xxx (4 occurrences)
□ 4. Case 'table' dans validateJSON remplacé (validation 7 niveaux)
□ 5. normalizeTableData remplacé (gestion erreurs renforcée)
□ 6. createTableSlide mis à jour (placeholder erreur table)
□ 7. Boucle forEach slides remplacée par for...of avec yields
□ 8. Label "Finalisation..." ajouté avant writeFile
□ 9. OPTIMAL_PROMPT remplacé par version v2
□ 10. Tests manuels effectués sur 3 JSON différents
```

---

## 🧪 **Tests de Validation**

### Test 1 : Chargement PptxGenJS
1. Renommer `pptxgen.bundle.js` temporairement
2. Ouvrir le HTML → doit afficher écran d'erreur rouge
3. Restaurer le fichier → recharger → doit fonctionner

### Test 2 : Tables Invalides
```json
{
  "metadata": {"title": "Test", "fileName": "test.pptx"},
  "slides": [
    {"type": "title", "title": "Test"},
    {"type": "table", "title": "Table Cassée", "tableData": []}
  ]
}
```
**Résultat attendu :** Erreur validation "tableData ne peut pas être vide"

### Test 3 : Feedback Progressif
Générer présentation avec 10+ slides → observer label changer "Génération slide X/10..."

### Test 4 : Prompt Cas Limites
Copier prompt v2 → tester avec IA → vérifier qu'elle génère des nombres en strings dans tables

---

## 📊 **Matrice de Compatibilité**

| Navigateur | Loader Robuste | Spread Fix | Tables | Feedback | Prompt |
|------------|---------------|-----------|--------|----------|--------|
| Chrome 100+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Firefox 95+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Safari 15+ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Edge 100+ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🆘 **Dépannage**

### Problème : "PptxGenJS n'est pas disponible"
**Solution :** Vérifier que `pptxgen.bundle.js` est dans le même dossier ou que la base64 est correctement embarquée

### Problème : "Unexpected token '.'"
**Solution :** Rechercher tous les `.{ZONES` et remplacer par `...ZONES`

### Problème : Label ne change pas pendant génération
**Solution :** Vérifier que `await new Promise(resolve => setTimeout(resolve, 0));` est bien présent dans la boucle

### Problème : Tables s'affichent "ERREUR TABLE"
**Solution :** Vérifier que `tableData` commence par un tableau d'en-têtes non vide

---

## 📞 **Support**

Pour toute question sur l'intégration :
1. Vérifier les logs console (F12)
2. Tester avec les JSON d'exemple fournis
3. Comparer votre code avec les fichiers de référence fournis

**Version du guide :** 2.0 (2025-01-23)
