/**
 * Corrections des fonctions de création de slides
 * Remplace les versions bugguées dans le HTML
 */

// ===== CONSTANTES LAYOUT (inchangées) =====
const LAYOUT = {
  width: 10,
  height: 5.625,
  margin: 0.5,
  titleHeight: 0.7,
  contentGap: 0.2,
  columnGap: 0.3,
  bulletIndent: 0.25
};

const ZONES = {
  title: {
    x: LAYOUT.margin,
    y: LAYOUT.margin,
    w: LAYOUT.width - (2 * LAYOUT.margin),
    h: LAYOUT.titleHeight
  },
  content: {
    x: LAYOUT.margin + LAYOUT.bulletIndent,
    y: LAYOUT.margin + LAYOUT.titleHeight + LAYOUT.contentGap,
    w: LAYOUT.width - (2 * LAYOUT.margin) - LAYOUT.bulletIndent,
    h: LAYOUT.height - (LAYOUT.margin + LAYOUT.titleHeight + LAYOUT.contentGap + LAYOUT.margin)
  }
};

// ===== FONCTIONS CORRIGÉES =====

function createTitleSlide(slide, data) {
  if (data.backgroundColor) slide.background = { color: data.backgroundColor };
  const titleY = (LAYOUT.height - 1.5) / 2;
  
  slide.addText(data.title, {
    x: LAYOUT.margin, 
    y: titleY, 
    w: LAYOUT.width - (2 * LAYOUT.margin), 
    h: 1.0,
    fontSize: 44, 
    bold: true, 
    color: data.titleColor || '363636', 
    align: 'center', 
    valign: 'middle'
  });
  
  if (data.subtitle) {
    slide.addText(data.subtitle, {
      x: LAYOUT.margin, 
      y: titleY + 1.2, 
      w: LAYOUT.width - (2 * LAYOUT.margin), 
      h: 0.6,
      fontSize: 24, 
      color: data.subtitleColor || '666666', 
      align: 'center', 
      valign: 'middle'
    });
  }
}

function createContentSlide(slide, data) {
  // ✅ CORRECTION : Utilisation correcte du spread operator
  slide.addText(data.title, { 
    ...ZONES.title, 
    fontSize: 32, 
    bold: true, 
    color: '0066cc' 
  });
  
  const bulletText = data.bullets.map(b => ({ 
    text: String(b), 
    options: { bullet: true, fontSize: 18, color: '333333' } 
  }));
  
  slide.addText(bulletText, { 
    ...ZONES.content, 
    fontSize: 18, 
    color: '333333', 
    valign: 'top' 
  });
}

function createTwoColumnSlide(slide, data) {
  // ✅ CORRECTION : Spread operator correct
  slide.addText(data.title, { 
    ...ZONES.title, 
    fontSize: 32, 
    bold: true, 
    color: '0066cc' 
  });
  
  const columnWidth = (ZONES.content.w - LAYOUT.columnGap) / 2;
  
  const leftText = data.leftContent.map(t => ({ 
    text: String(t), 
    options: { bullet: true, fontSize: 16, color: '333333' } 
  }));
  
  const rightText = data.rightContent.map(t => ({ 
    text: String(t), 
    options: { bullet: true, fontSize: 16, color: '333333' } 
  }));
  
  slide.addText(leftText, { 
    x: ZONES.content.x, 
    y: ZONES.content.y, 
    w: columnWidth, 
    h: ZONES.content.h, 
    valign: 'top' 
  });
  
  slide.addText(rightText, { 
    x: ZONES.content.x + columnWidth + LAYOUT.columnGap, 
    y: ZONES.content.y, 
    w: columnWidth, 
    h: ZONES.content.h, 
    valign: 'top' 
  });
}

function createTableSlide(slide, data) {
  // ✅ CORRECTION : Spread operator correct
  slide.addText(data.title, { 
    ...ZONES.title, 
    fontSize: 32, 
    bold: true, 
    color: '0066cc' 
  });
  
  // ✅ NOUVEAU : Validation stricte avant normalisation
  const sourceTable = data._normalizedTableData || data.tableData;
  
  if (!Array.isArray(sourceTable) || 
      sourceTable.length === 0 || 
      !Array.isArray(sourceTable[0]) || 
      sourceTable[0].length === 0) {
    
    // Tableau invalide détecté → placeholder d'erreur
    slide.addText('⚠️ Tableau indisponible\n\nStructure de données invalide détectée.\nVérifiez que tableData commence par un tableau d\'en-têtes non vide.', {
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
  
  // Normalisation sécurisée
  const tableData = normalizeTableData(sourceTable);
  
  const rowHeight = 0.35;
  const h = Math.min(ZONES.content.h, tableData.length * rowHeight);
  
  slide.addTable(tableData, {
    x: ZONES.content.x - LAYOUT.bulletIndent,
    y: ZONES.content.y,
    w: ZONES.content.w + LAYOUT.bulletIndent,
    h,
    border: { pt: 1, color: 'CFCFCF' }, 
    fontSize: 14, 
    color: '333333', 
    valign: 'middle', 
    align: 'left'
  });
}

function createImageSlide(slide, data) {
  // ✅ CORRECTION : Spread operator correct (c'était le bug principal)
  slide.addText(data.title, { 
    ...ZONES.title, 
    fontSize: 32, 
    bold: true, 
    color: '0066cc' 
  });
  
  if (!data.imagePath) return;
  
  if (isDataUri(data.imagePath)) {
    slide.addImage({ 
      data: data.imagePath, 
      x: ZONES.content.x, 
      y: ZONES.content.y, 
      w: ZONES.content.w, 
      h: ZONES.content.h, 
      sizing: { 
        type: 'contain', 
        w: ZONES.content.w, 
        h: ZONES.content.h 
      } 
    });
  } else if (isPlaceholderUri(data.imagePath)) {
    const description = data.imagePath.replace('IMAGE_PLACEHOLDER_', '');
    slide.addText(`[IMAGE À INSÉRER]\n\n${description}`, {
      x: ZONES.content.x, 
      y: ZONES.content.y, 
      w: ZONES.content.w, 
      h: ZONES.content.h,
      fontSize: 18, 
      color: '999999', 
      align: 'center', 
      valign: 'middle', 
      fill: 'F5F5F5', 
      border: { pt: 2, color: 'CCCCCC', type: 'dash' }
    });
  }
}

// ===== HELPER NORMALISATION RENFORCÉE =====

function normalizeTableData(rows) {
  // ✅ NOUVEAU : Validation stricte top-level
  if (!Array.isArray(rows) || 
      rows.length === 0 || 
      !Array.isArray(rows[0]) || 
      rows[0].length === 0) {
    console.error('Table invalide détectée:', rows);
    return [[{
      text: 'ERREUR TABLE',
      options: { bold: true, fill: 'FC8181', color: 'FFFFFF' }
    }]];
  }
  
  return rows.map((row, idxRow) => {
    if (!Array.isArray(row)) {
      console.warn(`Ligne ${idxRow} n'est pas un tableau, conversion forcée`);
      return [{ text: String(row), options: {} }];
    }
    
    return row.map(cell => {
      // Si déjà formaté correctement, conserver
      if (cell && typeof cell === 'object' && 'text' in cell) {
        return cell;
      }
      
      // Conversion sécurisée en objet formaté
      return {
        text: String(cell ?? ''),
        options: idxRow === 0 ? { 
          bold: true, 
          fill: 'E1E1E1', 
          color: '000000' 
        } : {}
      };
    });
  });
}

// Helpers inchangés
function isDataUri(s) { 
  return typeof s === 'string' && s.startsWith('data:image/'); 
}

function isPlaceholderUri(s) { 
  return typeof s === 'string' && s.startsWith('IMAGE_PLACEHOLDER_'); 
}
