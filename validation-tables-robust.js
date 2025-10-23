/**
 * Validation renforcée des tables avec garde-fous multiples
 * À intégrer dans la fonction validateJSON()
 */

// ===== VALIDATION TABLES : Section à remplacer dans validateJSON() =====

/**
 * AVANT (code actuel - partiel) :
 * 
 * case 'table': {
 *   if (!Array.isArray(slide.tableData)) {
 *     errors.push(`Slide ${n} (table) : 'tableData' doit être un tableau`);
 *   } else if (slide.tableData.length === 0) {
 *     errors.push(`Slide ${n} (table) : 'tableData' ne peut pas être vide`);
 *   } else {
 *     const header = slide.tableData[0];
 *     // ... reste validation ...
 *   }
 * }
 */

/**
 * ✅ APRÈS (version renforcée) :
 */
case 'table': {
  // Validation titre (commune à tous les types)
  if (!isNonEmptyString(slide.title)) {
    errors.push(`Slide ${n} : propriété 'title' manquante ou vide`);
  } else if (slide.title.trim().length > TITLE_MAX_LENGTH) {
    errors.push(`Slide ${n} : le titre ne peut pas dépasser ${TITLE_MAX_LENGTH} caractères (actuel : ${slide.title.trim().length})`);
  }
  
  // ✅ NIVEAU 1 : Validation existence et type
  if (!slide.tableData) {
    errors.push(`Slide ${n} (table) : propriété 'tableData' manquante`);
    break; // Arrêt ici si tableData absent
  }
  
  if (!Array.isArray(slide.tableData)) {
    errors.push(`Slide ${n} (table) : 'tableData' doit être un tableau (type reçu: ${typeof slide.tableData})`);
    break;
  }
  
  // ✅ NIVEAU 2 : Validation tableau non vide
  if (slide.tableData.length === 0) {
    errors.push(`Slide ${n} (table) : 'tableData' ne peut pas être vide`);
    break;
  }
  
  // ✅ NIVEAU 3 : Validation ligne d'en-têtes (CRITIQUE)
  const header = slide.tableData[0];
  
  if (!Array.isArray(header)) {
    errors.push(`Slide ${n} (table) : la première ligne (en-têtes) doit être un tableau (type reçu: ${typeof header})`);
    break;
  }
  
  if (header.length === 0) {
    errors.push(`Slide ${n} (table) : la ligne d'en-têtes ne peut pas être vide`);
    break;
  }
  
  // ✅ NIVEAU 4 : Validation contenu des en-têtes
  let hasInvalidHeaders = false;
  header.forEach((cell, idx) => {
    // Accepter String ou {text: String}
    const cellText = typeof cell === 'object' && cell !== null ? cell.text : cell;
    
    if (!isNonEmptyString(cellText)) {
      errors.push(`Slide ${n} (table) : en-tête colonne ${idx + 1} doit être une chaîne non vide (reçu: ${JSON.stringify(cell)})`);
      hasInvalidHeaders = true;
    }
  });
  
  if (hasInvalidHeaders) {
    break; // Pas la peine de valider le reste si les en-têtes sont cassés
  }
  
  // ✅ NIVEAU 5 : Validation nombre de colonnes
  const colCount = header.length;
  
  if (colCount > 4) {
    errors.push(`Slide ${n} (table) : maximum 4 colonnes autorisées (actuel : ${colCount})`);
  }
  
  // ✅ NIVEAU 6 : Validation lignes de données
  if (slide.tableData.length > 10) {
    errors.push(`Slide ${n} (table) : maximum 10 lignes autorisées (en-têtes inclus, actuel : ${slide.tableData.length})`);
  }
  
  // Validation cohérence nombre de colonnes
  slide.tableData.slice(1).forEach((row, idx) => {
    const rowNum = idx + 2; // +2 car idx commence à 0 et on skip les headers
    
    if (!Array.isArray(row)) {
      errors.push(`Slide ${n} (table) ligne ${rowNum} : chaque ligne doit être un tableau (type reçu: ${typeof row})`);
      return;
    }
    
    if (row.length !== colCount) {
      warns.push(`Slide ${n} (table) ligne ${rowNum} : nombre de colonnes incohérent (${row.length} cellules vs ${colCount} en-têtes)`);
    }
    
    // ✅ NIVEAU 7 : Validation contenu cellules (optionnel mais recommandé)
    row.forEach((cell, cellIdx) => {
      if (cell === null || cell === undefined) {
        warns.push(`Slide ${n} (table) ligne ${rowNum} colonne ${cellIdx + 1} : cellule vide/null détectée`);
      }
    });
  });
  
  // ✅ NIVEAU 8 : Pré-normalisation sécurisée
  try {
    slide._normalizedTableData = normalizeTableDataSafe(slide.tableData);
  } catch (normError) {
    errors.push(`Slide ${n} (table) : échec normalisation des données - ${normError.message}`);
  }
  
  break;
}

// ===== FONCTION NORMALISATION SÉCURISÉE =====

/**
 * Version "safe" de normalizeTableData avec gestion d'erreur exhaustive
 */
function normalizeTableDataSafe(rows) {
  // Triple vérification (paranoia mode)
  if (!Array.isArray(rows)) {
    throw new Error(`tableData n'est pas un tableau (type: ${typeof rows})`);
  }
  
  if (rows.length === 0) {
    throw new Error('tableData est un tableau vide');
  }
  
  if (!Array.isArray(rows[0])) {
    throw new Error(`Première ligne (en-têtes) n'est pas un tableau (type: ${typeof rows[0]})`);
  }
  
  if (rows[0].length === 0) {
    throw new Error('Ligne d\'en-têtes est vide');
  }
  
  // Normalisation ligne par ligne
  return rows.map((row, idxRow) => {
    // Gestion ligne non-tableau (conversion forcée)
    if (!Array.isArray(row)) {
      console.warn(`normalizeTableDataSafe: ligne ${idxRow} n'est pas un tableau, conversion en [row]`);
      row = [row];
    }
    
    return row.map((cell, idxCell) => {
      // Si déjà au format {text, options}, conserver
      if (cell && typeof cell === 'object' && !Array.isArray(cell) && 'text' in cell) {
        return {
          text: String(cell.text ?? ''),
          options: cell.options || (idxRow === 0 ? { bold: true, fill: 'E1E1E1', color: '000000' } : {})
        };
      }
      
      // Conversion primitive → objet formaté
      let textValue;
      
      if (cell === null || cell === undefined) {
        textValue = '';
      } else if (typeof cell === 'object') {
        // Objet bizarre sans 'text' → stringify
        textValue = JSON.stringify(cell);
      } else {
        textValue = String(cell);
      }
      
      return {
        text: textValue,
        options: idxRow === 0 ? { 
          bold: true, 
          fill: 'E1E1E1', 
          color: '000000' 
        } : {}
      };
    });
  });
}

// ===== TESTS UNITAIRES (à exécuter en dev) =====

/**
 * Tests à lancer dans la console pour valider la robustesse
 */
function runTableValidationTests() {
  const tests = [
    {
      name: 'Table valide standard',
      input: [['A', 'B'], ['1', '2'], ['3', '4']],
      shouldPass: true
    },
    {
      name: 'Table avec null dans data',
      input: [['A', 'B'], [null, '2'], ['3', undefined]],
      shouldPass: true, // Devrait passer avec warnings
      expectWarnings: true
    },
    {
      name: 'Table sans en-têtes',
      input: [],
      shouldPass: false
    },
    {
      name: 'Table avec en-tête non-tableau',
      input: ['wrong', ['1', '2']],
      shouldPass: false
    },
    {
      name: 'Table avec colonnes incohérentes',
      input: [['A', 'B'], ['1'], ['2', '3', '4']],
      shouldPass: true, // Passe mais warnings
      expectWarnings: true
    },
    {
      name: 'Table avec objets déjà formatés',
      input: [
        [{text: 'A', options: {bold: true}}, {text: 'B'}],
        [{text: '1'}, {text: '2'}]
      ],
      shouldPass: true
    }
  ];
  
  console.group('🧪 Tests validation tables');
  
  tests.forEach(test => {
    console.log(`\n▶ Test: ${test.name}`);
    try {
      const normalized = normalizeTableDataSafe(test.input);
      console.log(test.shouldPass ? '✅ PASS' : '❌ FAIL (devrait échouer)');
      console.log('Résultat:', normalized);
    } catch (err) {
      console.log(test.shouldPass ? `❌ FAIL: ${err.message}` : '✅ PASS (erreur attendue)');
    }
  });
  
  console.groupEnd();
}

// Décommenter pour tester en dev:
// runTableValidationTests();
