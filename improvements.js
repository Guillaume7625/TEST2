// ======================================
// Script d'amélioration pour le générateur PowerPoint
// Version 2.0 - Intégration des correctifs
// ======================================

// 1. Fonction de normalisation sécurisée des tables
function normalizeTableDataSafe(tableData) {
  try {
    if (!Array.isArray(tableData) || tableData.length === 0) {
      console.warn('⚠️ normalizeTableDataSafe : données invalides, retour placeholder');
      return [['Erreur'], ['Données invalides']];
    }

    const normalized = tableData.map(row => {
      if (!Array.isArray(row)) {
        console.warn('⚠️ Ligne non-tableau détectée:', row);
        return ['Erreur ligne'];
      }
      
      return row.map(cell => {
        // Gestion des cellules null/undefined
        if (cell === null || cell === undefined) {
          return { text: '' };
        }
        
        // Si c'est déjà un objet avec text
        if (typeof cell === 'object' && cell.text !== undefined) {
          return cell;
        }
        
        // Conversion en string sécurisée
        const textValue = String(cell);
        
        // Si c'est un header (première ligne), style différent
        const isHeader = tableData.indexOf(row) === 0;
        
        return {
          text: textValue,
          options: isHeader ? {
            fontSize: 14,
            bold: true,
            color: 'FFFFFF',
            fill: '0066CC',
            align: 'center',
            valign: 'middle'
          } : {
            fontSize: 12,
            color: '333333',
            align: 'left',
            valign: 'middle'
          }
        };
      });
    });

    return normalized;
  } catch (error) {
    console.error('❌ normalizeTableDataSafe : exception', error);
    return [['Erreur critique'], [error.message]];
  }
}

// 2. Validation améliorée des tables (7 niveaux)
function validateTableEnhanced(tableData, slideNumber) {
  const errors = [];
  const warnings = [];

  // Niveau 1: Existence et type
  if (!tableData) {
    errors.push(`Slide ${slideNumber}: tableData manquant`);
    return { errors, warnings, valid: false };
  }

  if (!Array.isArray(tableData)) {
    errors.push(`Slide ${slideNumber}: tableData doit être un tableau`);
    return { errors, warnings, valid: false };
  }

  // Niveau 2: Non vide
  if (tableData.length === 0) {
    errors.push(`Slide ${slideNumber}: tableData ne peut pas être vide`);
    return { errors, warnings, valid: false };
  }

  // Niveau 3: Validation des en-têtes
  const header = tableData[0];
  if (!Array.isArray(header)) {
    errors.push(`Slide ${slideNumber}: la première ligne doit être un tableau d'en-têtes`);
    return { errors, warnings, valid: false };
  }

  if (header.length === 0) {
    errors.push(`Slide ${slideNumber}: les en-têtes ne peuvent pas être vides`);
    return { errors, warnings, valid: false };
  }

  // Niveau 4: Contenu des en-têtes
  let hasValidHeaders = true;
  header.forEach((cell, idx) => {
    const cellText = typeof cell === 'object' && cell !== null ? cell.text : cell;
    if (!cellText || String(cellText).trim() === '') {
      errors.push(`Slide ${slideNumber}: en-tête colonne ${idx + 1} vide`);
      hasValidHeaders = false;
    }
  });

  if (!hasValidHeaders) {
    return { errors, warnings, valid: false };
  }

  // Niveau 5: Limites de dimensions
  const colCount = header.length;
  if (colCount > 4) {
    errors.push(`Slide ${slideNumber}: maximum 4 colonnes (actuel: ${colCount})`);
  }

  if (tableData.length > 10) {
    errors.push(`Slide ${slideNumber}: maximum 10 lignes (actuel: ${tableData.length})`);
  }

  // Niveau 6: Cohérence des lignes
  tableData.slice(1).forEach((row, idx) => {
    const rowNum = idx + 2;
    if (!Array.isArray(row)) {
      warnings.push(`Slide ${slideNumber} ligne ${rowNum}: format incorrect`);
    } else if (row.length !== colCount) {
      warnings.push(`Slide ${slideNumber} ligne ${rowNum}: ${row.length} cellules vs ${colCount} en-têtes`);
    }

    // Vérifier les cellules vides
    if (Array.isArray(row)) {
      row.forEach((cell, cellIdx) => {
        if (cell === null || cell === undefined || String(cell).trim() === '') {
          warnings.push(`Slide ${slideNumber} ligne ${rowNum} col ${cellIdx + 1}: cellule vide`);
        }
      });
    }
  });

  return { 
    errors, 
    warnings, 
    valid: errors.length === 0 
  };
}

// 3. Génération progressive avec feedback
async function generatePowerPointProgressive(data, callbacks = {}) {
  const {
    onProgress = () => {},
    onSlideComplete = () => {},
    onWarning = () => {},
    onError = () => {},
    onComplete = () => {}
  } = callbacks;

  try {
    // Vérifier PptxGenJS
    const PptxGenJS = window.PptxGenJS || window.pptxgen;
    if (!PptxGenJS) {
      throw new Error('PptxGenJS non disponible');
    }

    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';
    pptx.author = data.metadata.author || 'Auteur';
    pptx.title = data.metadata.title || 'Présentation';
    pptx.company = data.metadata.company || '';
    pptx.subject = data.metadata.subject || '';

    const totalSlides = data.slides.length;
    const warnings = [];

    // Génération progressive
    for (let i = 0; i < totalSlides; i++) {
      const slideData = data.slides[i];
      const progress = ((i + 1) / totalSlides) * 100;
      
      onProgress({
        current: i + 1,
        total: totalSlides,
        percent: progress,
        message: `Génération slide ${i + 1}/${totalSlides}: ${slideData.type}`
      });

      // Micro-pause pour UI update
      await new Promise(resolve => setTimeout(resolve, 10));

      const slide = pptx.addSlide();

      // Traitement selon le type avec gestion d'erreurs
      try {
        switch (slideData.type) {
          case 'title':
            createTitleSlideEnhanced(slide, slideData);
            break;
          case 'content':
            createContentSlideEnhanced(slide, slideData);
            break;
          case 'twoColumn':
            createTwoColumnSlideEnhanced(slide, slideData);
            break;
          case 'table':
            const tableWarnings = createTableSlideEnhanced(slide, slideData, i + 1);
            if (tableWarnings.length > 0) {
              warnings.push(...tableWarnings);
              tableWarnings.forEach(w => onWarning(w));
            }
            break;
          case 'image':
            createImageSlideEnhanced(slide, slideData);
            break;
          default:
            warnings.push(`Type inconnu: ${slideData.type}`);
            onWarning(`Slide ${i + 1}: type inconnu "${slideData.type}"`);
        }
        
        onSlideComplete(i + 1, slideData.type);
      } catch (slideError) {
        const errorMsg = `Erreur slide ${i + 1}: ${slideError.message}`;
        warnings.push(errorMsg);
        onWarning(errorMsg);
        console.error(errorMsg, slideError);
      }
    }

    // Finalisation
    onProgress({
      current: totalSlides,
      total: totalSlides,
      percent: 100,
      message: 'Finalisation du fichier...'
    });

    await new Promise(resolve => setTimeout(resolve, 100));

    const fileName = data.metadata.fileName || `presentation-${Date.now()}.pptx`;
    await pptx.writeFile({ fileName });

    onComplete({
      success: true,
      fileName,
      warnings,
      slideCount: totalSlides
    });

    return { success: true, fileName, warnings };

  } catch (error) {
    onError(error);
    throw error;
  }
}

// 4. Création améliorée des slides
function createTitleSlideEnhanced(slide, data) {
  if (data.backgroundColor) {
    slide.background = { color: data.backgroundColor };
  }

  const titleOptions = {
    x: 1,
    y: 2.5,
    w: 8,
    h: 1.5,
    fontSize: 44,
    bold: true,
    color: data.titleColor || '363636',
    align: 'center',
    valign: 'middle'
  };

  slide.addText(data.title || 'Titre', titleOptions);

  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: 1,
      y: 4,
      w: 8,
      h: 1,
      fontSize: 24,
      color: data.subtitleColor || '666666',
      align: 'center',
      valign: 'middle'
    });
  }
}

function createContentSlideEnhanced(slide, data) {
  // Titre
  slide.addText(data.title || 'Contenu', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '0066CC'
  });

  // Bullets avec validation
  const bullets = (data.bullets || []).map(b => ({
    text: String(b || ''),
    options: { bullet: true, fontSize: 18, color: '333333' }
  }));

  slide.addText(bullets, {
    x: 0.5,
    y: 1.5,
    w: 9,
    h: 5,
    fontSize: 18,
    color: '333333',
    valign: 'top'
  });
}

function createTwoColumnSlideEnhanced(slide, data) {
  // Titre
  slide.addText(data.title || 'Deux colonnes', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '0066CC'
  });

  const columnWidth = 4.25;
  const columnGap = 0.5;

  // Colonne gauche
  const leftText = (data.leftContent || []).map(t => ({
    text: String(t || ''),
    options: { bullet: true, fontSize: 16, color: '333333' }
  }));

  slide.addText(leftText, {
    x: 0.5,
    y: 1.5,
    w: columnWidth,
    h: 5,
    valign: 'top'
  });

  // Colonne droite
  const rightText = (data.rightContent || []).map(t => ({
    text: String(t || ''),
    options: { bullet: true, fontSize: 16, color: '333333' }
  }));

  slide.addText(rightText, {
    x: 0.5 + columnWidth + columnGap,
    y: 1.5,
    w: columnWidth,
    h: 5,
    valign: 'top'
  });
}

function createTableSlideEnhanced(slide, data, slideNumber) {
  const warnings = [];
  
  // Titre
  slide.addText(data.title || 'Tableau', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '0066CC'
  });

  // Validation de la table
  const validation = validateTableEnhanced(data.tableData, slideNumber);
  
  if (!validation.valid) {
    // Afficher un placeholder d'erreur
    slide.addText(
      '⚠️ Tableau indisponible\n\n' + 
      validation.errors.join('\n'),
      {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 5,
        fontSize: 18,
        color: 'C53030',
        align: 'center',
        valign: 'middle',
        fill: 'FFF5F5',
        border: { pt: 2, color: 'FC8181', type: 'dash' }
      }
    );
    warnings.push(...validation.errors);
    return warnings;
  }

  // Ajouter les avertissements
  warnings.push(...validation.warnings);

  try {
    // Normalisation sécurisée
    const normalizedData = normalizeTableDataSafe(data.tableData);
    
    // Ajout de la table
    slide.addTable(normalizedData, {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5,
      border: { pt: 1, color: 'CFCFCF' },
      fontSize: 14,
      color: '333333',
      valign: 'middle',
      align: 'left'
    });
  } catch (error) {
    // En cas d'erreur, afficher un placeholder
    slide.addText(
      '❌ Erreur lors de la création du tableau\n\n' + error.message,
      {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 5,
        fontSize: 18,
        color: 'C53030',
        align: 'center',
        valign: 'middle',
        fill: 'FFF5F5',
        border: { pt: 2, color: 'FC8181', type: 'dash' }
      }
    );
    warnings.push(`Table error: ${error.message}`);
  }

  return warnings;
}

function createImageSlideEnhanced(slide, data) {
  // Titre
  slide.addText(data.title || 'Image', {
    x: 0.5,
    y: 0.5,
    w: 9,
    h: 1,
    fontSize: 32,
    bold: true,
    color: '0066CC'
  });

  if (!data.imagePath) {
    slide.addText('[Aucune image spécifiée]', {
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5,
      fontSize: 18,
      color: '999999',
      align: 'center',
      valign: 'middle',
      fill: 'F5F5F5',
      border: { pt: 2, color: 'CCCCCC', type: 'dash' }
    });
    return;
  }

  // Détection du type d'image
  const isDataUri = data.imagePath.startsWith('data:');
  const isPlaceholder = data.imagePath.startsWith('IMAGE_PLACEHOLDER_');

  if (isDataUri) {
    // Image en base64
    slide.addImage({
      data: data.imagePath,
      x: 0.5,
      y: 1.5,
      w: 9,
      h: 5,
      sizing: { type: 'contain', w: 9, h: 5 }
    });
  } else if (isPlaceholder) {
    // Placeholder descriptif
    const description = data.imagePath.replace('IMAGE_PLACEHOLDER_', '').replace(/-/g, ' ');
    slide.addText(
      `[IMAGE À INSÉRER]\n\n${description}`,
      {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 5,
        fontSize: 18,
        color: '999999',
        align: 'center',
        valign: 'middle',
        fill: 'F5F5F5',
        border: { pt: 2, color: 'CCCCCC', type: 'dash' }
      }
    );
  } else {
    // URL externe (non supportée offline)
    slide.addText(
      `[IMAGE EXTERNE]\n\n${data.imagePath}\n\n⚠️ Les images externes ne sont pas supportées en mode offline`,
      {
        x: 0.5,
        y: 1.5,
        w: 9,
        h: 5,
        fontSize: 16,
        color: 'C53030',
        align: 'center',
        valign: 'middle',
        fill: 'FFF5F5',
        border: { pt: 2, color: 'FC8181', type: 'dash' }
      }
    );
  }
}

// Export des fonctions pour utilisation
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeTableDataSafe,
    validateTableEnhanced,
    generatePowerPointProgressive,
    createTitleSlideEnhanced,
    createContentSlideEnhanced,
    createTwoColumnSlideEnhanced,
    createTableSlideEnhanced,
    createImageSlideEnhanced
  };
}

console.log('✅ Améliorations chargées avec succès');