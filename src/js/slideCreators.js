/**
 * Slide creation functions for different slide types
 */

import { LAYOUT, ZONES } from './constants.js';
import { isDataUri, isPlaceholderUri, truncateToWords } from './utils.js';
import { normalizeTableData } from './tableNormalizer.js';

/**
 * Create title slide
 */
export function createTitleSlide(slide, data) {
  if (data.backgroundColor) {
    slide.background = { color: data.backgroundColor };
  }
  
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

/**
 * Create content slide with bullets
 * QUICK WIN #3: Limit to 5 bullets max
 * QUICK WIN #4: Colored header for professional look
 */
export function createContentSlide(slide, data) {
  // QUICK WIN #4: Header coloré avec fond bleu
  slide.addText(data.title, {
    ...ZONES.title,
    fontSize: 32,
    bold: true,
    color: 'FFFFFF',      // Texte blanc
    fill: '0066CC',       // Fond bleu
    align: 'left'
  });
  
  // QUICK WIN #3: Limiter à 5 bullets maximum
  const bullets = data.bullets.slice(0, 5);
  
  // Avertissement console si tronqué
  if (data.bullets.length > 5) {
    console.warn(`⚠️ Slide "${data.title}": ${data.bullets.length} bullets détectés, limité à 5 pour lisibilité`);
  }
  
  // QUICK WIN #2: Tronquer chaque bullet à 15 mots max
  const bulletText = bullets.map(b => {
    const truncated = truncateToWords(String(b), 15);
    return {
      text: truncated,
      options: { bullet: true }
    };
  });
  
  slide.addText(bulletText, {
    ...ZONES.content,
    fontSize: 18,
    color: '333333',
    valign: 'top'
  });
}

/**
 * Create two-column slide
 */
export function createTwoColumnSlide(slide, data) {
  slide.addText(data.title, {
    ...ZONES.title,
    fontSize: 32,
    bold: true,
    color: '0066cc'
  });
  
  const columnWidth = (ZONES.content.w - LAYOUT.columnGap) / 2;
  
  const leftText = data.leftContent.map(t => ({
    text: String(t),
    options: { bullet: true }
  }));
  
  const rightText = data.rightContent.map(t => ({
    text: String(t),
    options: { bullet: true }
  }));
  
  slide.addText(leftText, {
    x: ZONES.content.x,
    y: ZONES.content.y,
    w: columnWidth,
    h: ZONES.content.h,
    fontSize: 16,
    color: '333333',
    valign: 'top'
  });
  
  slide.addText(rightText, {
    x: ZONES.content.x + columnWidth + LAYOUT.columnGap,
    y: ZONES.content.y,
    w: columnWidth,
    h: ZONES.content.h,
    fontSize: 16,
    color: '333333',
    valign: 'top'
  });
}

/**
 * Create table slide with robust error handling
 */
export function createTableSlide(slide, data) {
  slide.addText(data.title, {
    ...ZONES.title,
    fontSize: 32,
    bold: true,
    color: '0066cc'
  });
  
  const sourceTable = data._normalizedTableData || data.tableData;
  
  // Strict validation before rendering
  if (
    !Array.isArray(sourceTable) ||
    sourceTable.length === 0 ||
    !Array.isArray(sourceTable[0]) ||
    sourceTable[0].length === 0
  ) {
    // Display error placeholder
    slide.addText(
      '⚠️ Tableau indisponible\n\nStructure de données invalide détectée.\nVérifiez que tableData commence par un tableau d\'en-têtes non vide.',
      {
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
      }
    );
    return;
  }
  
  const normalizedData = normalizeTableData(sourceTable);
  
  // QUICK WIN #1: Alternance de lignes pour look professionnel
  const tableData = normalizedData.map((row, rowIndex) => {
    return row.map(cell => {
      const isHeader = rowIndex === 0;
      const isEvenRow = rowIndex % 2 === 0;
      
      return {
        text: cell,
        options: {
          fill: isHeader ? '0066CC' : (isEvenRow ? 'F5F5F5' : 'FFFFFF'),
          color: isHeader ? 'FFFFFF' : '333333',
          bold: isHeader,
          fontSize: isHeader ? 14 : 13,
          align: 'center',
          valign: 'middle'
        }
      };
    });
  });
  
  const rowHeight = 0.35;
  const h = Math.min(ZONES.content.h, tableData.length * rowHeight);
  
  slide.addTable(tableData, {
    x: ZONES.content.x - LAYOUT.bulletIndent,
    y: ZONES.content.y,
    w: ZONES.content.w + LAYOUT.bulletIndent,
    h,
    border: { pt: 1, color: 'CFCFCF' }
  });
}

/**
 * Create image slide
 */
export function createImageSlide(slide, data) {
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
