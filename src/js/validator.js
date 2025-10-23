/**
 * JSON validation with MAXIMUM ROBUSTNESS
 * - Automatic JSON sanitization
 * - Tolerant validation with auto-corrections
 * - Defensive error handling
 * - Never crashes, always provides feedback
 */

import { VALIDATION, FILENAME_PATTERN, VALID_SLIDE_TYPES } from './constants.js';
import { isHex6, countWords, isDataUri, isPlaceholderUri, isNonEmptyString } from './utils.js';
import { normalizeTableDataSafe } from './tableNormalizer.js';

/**
 * LAYER 1: Advanced JSON Sanitizer
 * Automatically fixes common JSON syntax errors
 */
export function cleanJSONString(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return '';
  }
  
  let cleaned = jsonString.trim();
  
  // 1. Remove BOM and invisible characters
  cleaned = cleaned.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 2. Fix nested double quotes: ""text"" → "text"
  cleaned = cleaned.replace(/""\s*([^"]*)\s*""/g, '"$1"');
  
  // 3. Fix consecutive double quotes in strings: "text""more" → "text more"
  cleaned = cleaned.replace(/""(?!\s)/g, ' ');
  
  // 4. Fix double quotes in arrays: ["item", ""nested""] → ["item", "nested"]
  cleaned = cleaned.replace(/(\[\s*"[^"]*)""\s*([^"]*)""\s*([^"]*")/g, '$1$2$3');
  
  // 5. Remove trailing commas: {"key": "value",} → {"key": "value"}
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
  
  // 6. Add missing commas: "text1" "text2" → "text1", "text2"
  cleaned = cleaned.replace(/"\s+"/g, '", "');
  
  // 7. Add missing commas between objects: } { → }, {
  cleaned = cleaned.replace(/\}\s+\{/g, '}, {');
  
  // 8. Add missing commas between ] and {: ] { → ], {
  cleaned = cleaned.replace(/\]\s+\{/g, '], {');
  
  // 9. Fix escaped single quotes: \' → '
  cleaned = cleaned.replace(/\\'/g, "'");
  
  // 10. Remove comments (not valid JSON but sometimes added)
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 11. Fix missing quotes around keys (common mistake)
  // {title: "value"} → {"title": "value"}
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  return cleaned;
}

/**
 * LAYER 2: Tolerant JSON Parser with Auto-Correction
 * Parses JSON string with automatic sanitization and detailed error messages
 */
export function parseJSONTolerant(jsonString) {
  const warnings = [];
  let data;
  
  // Clean the JSON
  const cleaned = cleanJSONString(jsonString);
  
  if (cleaned !== jsonString) {
    warnings.push('✓ Corrections automatiques appliquées au JSON');
  }
  
  try {
    data = JSON.parse(cleaned);
  } catch (error) {
    // Enhanced error message with exact position
    const lineMatch = error.message.match(/line (\d+)/);
    const colMatch = error.message.match(/column (\d+)/);
    const posMatch = error.message.match(/position (\d+)/);
    
    let userMessage = '❌ Erreur JSON non corrigeable:\n\n';
    
    if (lineMatch && colMatch) {
      const line = parseInt(lineMatch[1]);
      const col = parseInt(colMatch[1]);
      const lines = cleaned.split('\n');
      
      userMessage += `Ligne ${line}, colonne ${col}:\n`;
      if (lines[line - 1]) {
        userMessage += `${lines[line - 1]}\n`;
        userMessage += ' '.repeat(Math.max(0, col - 1)) + '^\n\n';
      }
    } else if (posMatch) {
      const pos = parseInt(posMatch[1]);
      const context = cleaned.substring(Math.max(0, pos - 50), Math.min(cleaned.length, pos + 50));
      userMessage += `Position ${pos}:\n...${context}...\n\n`;
    }
    
    userMessage += 'Message: ' + error.message + '\n\n';
    userMessage += '💡 Solutions courantes:\n';
    userMessage += '• Vérifiez les guillemets et virgules\n';
    userMessage += '• Pas de virgule après le dernier élément\n';
    userMessage += '• Utilisez jsonlint.com pour valider\n';
    userMessage += '• Régénérez le JSON avec l\'IA\n';
    
    throw new Error(userMessage);
  }
  
  return { data, warnings };
}

/**
 * LAYER 3: Entry point - Parse and Validate with Tolerance
 * Accepts JSON string, auto-sanitizes, and validates with corrections
 * 
 * @param {string|Object} input - JSON string or object to validate
 * @returns {Object} { valid: boolean, data: Object, errors: string[], warnings: string[] }
 */
export function validateJSONInput(input) {
  const warnings = [];
  let data;
  
  // Handle both string and object inputs
  if (typeof input === 'string') {
    try {
      const parseResult = parseJSONTolerant(input);
      data = parseResult.data;
      warnings.push(...parseResult.warnings);
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: [error.message],
        warnings: []
      };
    }
  } else if (typeof input === 'object' && input !== null) {
    data = input;
  } else {
    return {
      valid: false,
      data: null,
      errors: ['Le JSON doit être une chaîne ou un objet valide'],
      warnings: []
    };
  }
  
  // Apply semantic validation with auto-corrections
  return validateJSONSemantic(data, warnings);
}

/**
 * LAYER 4: Semantic Validation with Auto-Correction
 * Validates structure and applies automatic fixes where possible
 */
function validateJSONSemantic(data, warnings = []) {
  const errors = [];
  
  // Auto-correct: Add missing metadata
  if (!data.metadata) {
    data.metadata = {};
    warnings.push('✓ Section metadata manquante → créée automatiquement');
  }
  
  if (!data.metadata.title) {
    data.metadata.title = 'Présentation';
    warnings.push('✓ metadata.title manquant → "Présentation" ajouté');
  }
  
  if (!data.metadata.fileName) {
    data.metadata.fileName = 'presentation.pptx';
    warnings.push('✓ metadata.fileName manquant → "presentation.pptx" ajouté');
  }
  
  if (!data.metadata.author) {
    data.metadata.author = 'Auteur';
  }
  
  if (!data.metadata.company) {
    data.metadata.company = '';
  }
  
  // Validate metadata with tolerance
  validateMetadataTolerant(data.metadata, errors, warnings);
  
  // Auto-correct: Add empty slides array if missing
  if (!data.slides) {
    data.slides = [];
    warnings.push('⚠️ Array slides manquant → créé vide (ajoutez des slides!)');
  }
  
  if (!Array.isArray(data.slides)) {
    errors.push("La propriété 'slides' doit être un tableau");
    return { valid: false, data, errors, warnings };
  }
  
  if (data.slides.length === 0) {
    errors.push("Le tableau 'slides' ne peut pas être vide");
    return { valid: false, data, errors, warnings };
  }
  
  // Validate slide structure rules (tolerant)
  if (data.slides[0]?.type !== 'title') {
    warnings.push('⚠️ La première slide devrait être de type "title"');
  }
  
  const lastSlide = data.slides[data.slides.length - 1];
  if (lastSlide?.type !== 'content') {
    warnings.push('⚠️ La dernière slide devrait être de type "content" (conclusion)');
  }
  
  // LAYER 5: Normalize each slide with defensive try/catch
  const validSlides = [];
  data.slides.forEach((slide, index) => {
    try {
      const normalizedSlide = normalizeSlideDefensive(slide, index + 1, errors, warnings);
      if (normalizedSlide) {
        validSlides.push(normalizedSlide);
      }
    } catch (slideError) {
      warnings.push(`⚠️ Slide ${index + 1} ignorée: ${slideError.message}`);
    }
  });
  
  data.slides = validSlides;
  
  // Final check
  if (validSlides.length === 0) {
    errors.push('Aucune slide valide trouvée après normalisation');
    return { valid: false, data, errors, warnings };
  }
  
  return {
    valid: errors.length === 0,
    data,
    errors,
    warnings
  };
}

/**
 * Original validateJSON for backward compatibility
 * 
 * @param {Object} data - JSON data to validate
 * @returns {Object} { errors: string[], warns: string[] }
 */
export function validateJSON(data) {
  const errors = [];
  const warns = [];
  
  // Top-level validation
  if (!data || typeof data !== 'object') {
    errors.push('JSON must be a valid object');
    return { errors, warns };
  }
  
  // Validate metadata
  validateMetadata(data.metadata, errors);
  
  // Validate slides array
  if (!data.slides || !Array.isArray(data.slides)) {
    errors.push("Property 'slides' must be an array");
    return { errors, warns };
  }
  
  if (data.slides.length === 0) {
    errors.push("Array 'slides' cannot be empty");
    return { errors, warns };
  }
  
  // Global slide rules
  if (data.slides[0]?.type !== 'title') {
    errors.push('First slide must be type "title"');
  }
  
  const lastSlide = data.slides[data.slides.length - 1];
  if (lastSlide?.type !== 'content') {
    errors.push('Last slide must be type "content" (conclusion + call-to-action)');
  }
  
  // Validate each slide
  data.slides.forEach((slide, index) => {
    validateSlide(slide, index + 1, errors, warns);
  });
  
  return { errors, warns };
}

/**
 * Validate metadata section (tolerant version)
 */
function validateMetadataTolerant(metadata, errors, warnings) {
  // Title validation with auto-trim
  if (!isNonEmptyString(metadata.title)) {
    errors.push('metadata.title est requis et doit être une chaîne non vide');
  } else {
    metadata.title = metadata.title.trim();
    if (metadata.title.length > VALIDATION.TITLE_MAX_LENGTH) {
      metadata.title = metadata.title.substring(0, VALIDATION.TITLE_MAX_LENGTH);
      warnings.push(`✓ metadata.title tronqué à ${VALIDATION.TITLE_MAX_LENGTH} caractères`);
    }
  }
  
  // Filename validation with auto-correction
  if (!isNonEmptyString(metadata.fileName)) {
    errors.push('metadata.fileName est requis et doit être une chaîne non vide');
  } else {
    const original = metadata.fileName;
    // Auto-fix: lowercase, remove accents, ensure .pptx
    metadata.fileName = metadata.fileName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/[^a-z0-9._-]/g, ''); // Remove invalid chars
    
    if (!metadata.fileName.endsWith('.pptx')) {
      metadata.fileName = metadata.fileName.replace(/\.(ppt|pptx)?$/, '') + '.pptx';
    }
    
    if (metadata.fileName !== original) {
      warnings.push(`✓ metadata.fileName corrigé: "${original}" → "${metadata.fileName}"`);
    }
  }
}

/**
 * Validate metadata section (strict version for backward compatibility)
 */
function validateMetadata(metadata, errors) {
  if (!metadata) {
    errors.push("Property 'metadata' is missing");
    return;
  }
  
  // Title validation
  if (!isNonEmptyString(metadata.title)) {
    errors.push('metadata.title is required and must be a non-empty string');
  } else if (metadata.title.trim().length > VALIDATION.TITLE_MAX_LENGTH) {
    errors.push(`metadata.title cannot exceed ${VALIDATION.TITLE_MAX_LENGTH} characters (current: ${metadata.title.trim().length})`);
  }
  
  // Filename validation
  if (!isNonEmptyString(metadata.fileName)) {
    errors.push('metadata.fileName is required and must be a non-empty string');
  } else if (!FILENAME_PATTERN.test(metadata.fileName)) {
    errors.push('metadata.fileName must be lowercase, no spaces or accents, ending with .pptx');
  }
}

/**
 * Validate individual slide
 */
function validateSlide(slide, slideNumber, errors, warns) {
  if (!slide || typeof slide !== 'object') {
    errors.push(`Slide ${slideNumber}: invalid element (object expected)`);
    return;
  }
  
  if (!slide.type) {
    errors.push(`Slide ${slideNumber}: property 'type' is missing`);
    return;
  }
  
  if (!VALID_SLIDE_TYPES.includes(slide.type)) {
    errors.push(`Slide ${slideNumber}: invalid type '${slide.type}'. Valid types: ${VALID_SLIDE_TYPES.join(', ')}`);
    return;
  }
  
  // Type-specific validation
  switch (slide.type) {
    case 'title':
      validateTitleSlide(slide, slideNumber, errors);
      break;
    case 'content':
      validateContentSlide(slide, slideNumber, errors);
      break;
    case 'twoColumn':
      validateTwoColumnSlide(slide, slideNumber, errors);
      break;
    case 'table':
      validateTableSlide(slide, slideNumber, errors, warns);
      break;
    case 'image':
      validateImageSlide(slide, slideNumber, errors);
      break;
  }
}

/**
 * Validate title slide
 */
function validateTitleSlide(slide, slideNumber, errors) {
  if (!isNonEmptyString(slide.title)) {
    errors.push(`Slide ${slideNumber} (title): 'title' is required and must be non-empty`);
  } else if (slide.title.trim().length > VALIDATION.TITLE_MAX_LENGTH) {
    errors.push(`Slide ${slideNumber} (title): title cannot exceed ${VALIDATION.TITLE_MAX_LENGTH} characters (current: ${slide.title.trim().length})`);
  }
  
  if (slide.backgroundColor && !isHex6(slide.backgroundColor)) {
    errors.push(`Slide ${slideNumber}: backgroundColor must be hex 6 (e.g., 0066CC)`);
  }
  
  if (slide.titleColor && !isHex6(slide.titleColor)) {
    errors.push(`Slide ${slideNumber}: titleColor must be hex 6 (e.g., FFFFFF)`);
  }
  
  if (slide.subtitleColor && !isHex6(slide.subtitleColor)) {
    errors.push(`Slide ${slideNumber}: subtitleColor must be hex 6`);
  }
}

/**
 * Validate content slide
 */
function validateContentSlide(slide, slideNumber, errors) {
  validateSlideTitle(slide, slideNumber, errors);
  
  if (!Array.isArray(slide.bullets)) {
    errors.push(`Slide ${slideNumber} (content): 'bullets' must be an array`);
    return;
  }
  
  if (slide.bullets.length < VALIDATION.MIN_BULLETS || slide.bullets.length > VALIDATION.MAX_BULLETS) {
    errors.push(`Slide ${slideNumber} (content): ${VALIDATION.MIN_BULLETS}-${VALIDATION.MAX_BULLETS} bullets required`);
  }
  
  slide.bullets.forEach((bullet, index) => {
    if (!isNonEmptyString(bullet)) {
      errors.push(`Slide ${slideNumber} (content) bullet ${index + 1}: must be a non-empty string`);
      return;
    }
    
    const words = countWords(bullet);
    if (words > VALIDATION.MAX_BULLET_WORDS) {
      errors.push(`Slide ${slideNumber} (content) bullet ${index + 1}: max ${VALIDATION.MAX_BULLET_WORDS} words (current: ${words})`);
    }
  });
}

/**
 * Validate two-column slide
 */
function validateTwoColumnSlide(slide, slideNumber, errors) {
  validateSlideTitle(slide, slideNumber, errors);
  
  if (!Array.isArray(slide.leftContent)) {
    errors.push(`Slide ${slideNumber} (twoColumn): 'leftContent' must be an array`);
  }
  
  if (!Array.isArray(slide.rightContent)) {
    errors.push(`Slide ${slideNumber} (twoColumn): 'rightContent' must be an array`);
  }
  
  if (Array.isArray(slide.leftContent) && 
      (slide.leftContent.length < VALIDATION.MIN_COLUMN_POINTS || slide.leftContent.length > VALIDATION.MAX_COLUMN_POINTS)) {
    errors.push(`Slide ${slideNumber} (twoColumn): ${VALIDATION.MIN_COLUMN_POINTS}-${VALIDATION.MAX_COLUMN_POINTS} points required in left column`);
  }
  
  if (Array.isArray(slide.rightContent) && 
      (slide.rightContent.length < VALIDATION.MIN_COLUMN_POINTS || slide.rightContent.length > VALIDATION.MAX_COLUMN_POINTS)) {
    errors.push(`Slide ${slideNumber} (twoColumn): ${VALIDATION.MIN_COLUMN_POINTS}-${VALIDATION.MAX_COLUMN_POINTS} points required in right column`);
  }
  
  // Validate left content
  if (Array.isArray(slide.leftContent)) {
    slide.leftContent.forEach((item, index) => {
      if (!isNonEmptyString(item)) {
        errors.push(`Slide ${slideNumber} (twoColumn) left column point ${index + 1}: must be a non-empty string`);
        return;
      }
      
      const words = countWords(item);
      if (words > VALIDATION.COLUMN_WORD_LIMIT) {
        errors.push(`Slide ${slideNumber} (twoColumn) left column point ${index + 1}: max ${VALIDATION.COLUMN_WORD_LIMIT} words (current: ${words})`);
      }
    });
  }
  
  // Validate right content
  if (Array.isArray(slide.rightContent)) {
    slide.rightContent.forEach((item, index) => {
      if (!isNonEmptyString(item)) {
        errors.push(`Slide ${slideNumber} (twoColumn) right column point ${index + 1}: must be a non-empty string`);
        return;
      }
      
      const words = countWords(item);
      if (words > VALIDATION.COLUMN_WORD_LIMIT) {
        errors.push(`Slide ${slideNumber} (twoColumn) right column point ${index + 1}: max ${VALIDATION.COLUMN_WORD_LIMIT} words (current: ${words})`);
      }
    });
  }
}

/**
 * Validate table slide (7-level validation)
 */
function validateTableSlide(slide, slideNumber, errors, warns) {
  validateSlideTitle(slide, slideNumber, errors);
  
  // Level 1: Existence and type
  if (!slide.tableData) {
    errors.push(`Slide ${slideNumber} (table): property 'tableData' is missing`);
    return;
  }
  
  if (!Array.isArray(slide.tableData)) {
    errors.push(`Slide ${slideNumber} (table): 'tableData' must be an array (received: ${typeof slide.tableData})`);
    return;
  }
  
  // Level 2: Non-empty
  if (slide.tableData.length === 0) {
    errors.push(`Slide ${slideNumber} (table): 'tableData' cannot be empty`);
    return;
  }
  
  // Level 3: Valid headers (CRITICAL)
  const header = slide.tableData[0];
  
  if (!Array.isArray(header)) {
    errors.push(`Slide ${slideNumber} (table): first row (headers) must be an array (received: ${typeof header})`);
    return;
  }
  
  if (header.length === 0) {
    errors.push(`Slide ${slideNumber} (table): header row cannot be empty`);
    return;
  }
  
  // Level 4: Header content validation
  let hasInvalidHeaders = false;
  header.forEach((cell, index) => {
    const cellText = typeof cell === 'object' && cell !== null ? cell.text : cell;
    if (!isNonEmptyString(cellText)) {
      errors.push(`Slide ${slideNumber} (table): header column ${index + 1} must be a non-empty string (received: ${JSON.stringify(cell)})`);
      hasInvalidHeaders = true;
    }
  });
  
  if (hasInvalidHeaders) {
    return;
  }
  
  // Level 5: Dimensional constraints
  const colCount = header.length;
  
  if (colCount > VALIDATION.MAX_TABLE_COLUMNS) {
    errors.push(`Slide ${slideNumber} (table): max ${VALIDATION.MAX_TABLE_COLUMNS} columns allowed (current: ${colCount})`);
  }
  
  if (slide.tableData.length > VALIDATION.MAX_TABLE_ROWS) {
    errors.push(`Slide ${slideNumber} (table): max ${VALIDATION.MAX_TABLE_ROWS} rows allowed (headers included, current: ${slide.tableData.length})`);
  }
  
  // Level 6: Row consistency
  slide.tableData.slice(1).forEach((row, index) => {
    const rowNum = index + 2;
    
    if (!Array.isArray(row)) {
      errors.push(`Slide ${slideNumber} (table) row ${rowNum}: each row must be an array (received: ${typeof row})`);
      return;
    }
    
    if (row.length !== colCount) {
      warns.push(`Slide ${slideNumber} (table) row ${rowNum}: inconsistent column count (${row.length} cells vs ${colCount} headers)`);
    }
    
    row.forEach((cell, cellIndex) => {
      if (cell === null || cell === undefined) {
        warns.push(`Slide ${slideNumber} (table) row ${rowNum} column ${cellIndex + 1}: empty/null cell detected`);
      }
    });
  });
  
  // Level 7: Safe pre-normalization
  try {
    slide._normalizedTableData = normalizeTableDataSafe(slide.tableData);
  } catch (normError) {
    errors.push(`Slide ${slideNumber} (table): normalization failed - ${normError.message}`);
  }
}

/**
 * Validate image slide
 */
function validateImageSlide(slide, slideNumber, errors) {
  validateSlideTitle(slide, slideNumber, errors);
  
  if (!isNonEmptyString(slide.imagePath)) {
    errors.push(`Slide ${slideNumber} (image): 'imagePath' is missing`);
  } else if (!(isDataUri(slide.imagePath) || isPlaceholderUri(slide.imagePath))) {
    errors.push(`Slide ${slideNumber} (image): imagePath must be a data URI (data:image/...) or placeholder IMAGE_PLACEHOLDER_... (no http/https URLs)`);
  }
}

/**
 * LAYER 6: Defensive Slide Normalization
 * Attempts to normalize/fix slide data instead of rejecting it
 */
function normalizeSlideDefensive(slide, slideNumber, errors, warnings) {
  if (!slide || typeof slide !== 'object') {
    throw new Error('élément invalide (objet attendu)');
  }
  
  if (!slide.type) {
    throw new Error('propriété \'type\' manquante');
  }
  
  if (!VALID_SLIDE_TYPES.includes(slide.type)) {
    throw new Error(`type invalide \'${slide.type}\'`);
  }
  
  // Auto-trim titles
  if (slide.title && typeof slide.title === 'string') {
    const original = slide.title;
    slide.title = slide.title.trim();
    if (slide.title.length > VALIDATION.TITLE_MAX_LENGTH) {
      slide.title = slide.title.substring(0, VALIDATION.TITLE_MAX_LENGTH);
      warnings.push(`✓ Slide ${slideNumber}: titre tronqué`);
    }
  }
  
  // Type-specific normalization
  switch (slide.type) {
    case 'title':
      return normalizeTitleSlide(slide, slideNumber, warnings);
    case 'content':
      return normalizeContentSlide(slide, slideNumber, warnings);
    case 'twoColumn':
      return normalizeTwoColumnSlide(slide, slideNumber, warnings);
    case 'table':
      return normalizeTableSlide(slide, slideNumber, warnings);
    case 'image':
      return normalizeImageSlide(slide, slideNumber, warnings);
    default:
      throw new Error(`type non géré: ${slide.type}`);
  }
}

function normalizeTitleSlide(slide, slideNumber, warnings) {
  if (!isNonEmptyString(slide.title)) {
    throw new Error('titre manquant');
  }
  
  // Auto-fix colors
  if (slide.backgroundColor && !isHex6(slide.backgroundColor)) {
    delete slide.backgroundColor;
    warnings.push(`✓ Slide ${slideNumber}: backgroundColor invalide supprimé`);
  }
  
  if (slide.titleColor && !isHex6(slide.titleColor)) {
    delete slide.titleColor;
    warnings.push(`✓ Slide ${slideNumber}: titleColor invalide supprimé`);
  }
  
  if (slide.subtitleColor && !isHex6(slide.subtitleColor)) {
    delete slide.subtitleColor;
    warnings.push(`✓ Slide ${slideNumber}: subtitleColor invalide supprimé`);
  }
  
  return slide;
}

function normalizeContentSlide(slide, slideNumber, warnings) {
  if (!isNonEmptyString(slide.title)) {
    throw new Error('titre manquant');
  }
  
  if (!Array.isArray(slide.bullets)) {
    throw new Error('bullets doit être un tableau');
  }
  
  // Filter and trim bullets
  const validBullets = slide.bullets
    .filter(b => isNonEmptyString(b))
    .map(b => b.trim())
    .filter(b => b.length > 0);
  
  if (validBullets.length !== slide.bullets.length) {
    warnings.push(`✓ Slide ${slideNumber}: bullets vides supprimés (${slide.bullets.length} → ${validBullets.length})`);
  }
  
  slide.bullets = validBullets;
  
  if (slide.bullets.length < VALIDATION.MIN_BULLETS) {
    throw new Error(`minimum ${VALIDATION.MIN_BULLETS} bullets requis`);
  }
  
  if (slide.bullets.length > VALIDATION.MAX_BULLETS) {
    slide.bullets = slide.bullets.slice(0, VALIDATION.MAX_BULLETS);
    warnings.push(`✓ Slide ${slideNumber}: bullets tronqués à ${VALIDATION.MAX_BULLETS}`);
  }
  
  // Truncate long bullets
  slide.bullets = slide.bullets.map((bullet, index) => {
    const words = countWords(bullet);
    if (words > VALIDATION.MAX_BULLET_WORDS) {
      const wordArray = bullet.split(/\s+/).slice(0, VALIDATION.MAX_BULLET_WORDS);
      const truncated = wordArray.join(' ') + '...';
      warnings.push(`✓ Slide ${slideNumber} bullet ${index + 1}: tronqué à ${VALIDATION.MAX_BULLET_WORDS} mots`);
      return truncated;
    }
    return bullet;
  });
  
  return slide;
}

function normalizeTwoColumnSlide(slide, slideNumber, warnings) {
  if (!isNonEmptyString(slide.title)) {
    throw new Error('titre manquant');
  }
  
  if (!Array.isArray(slide.leftContent)) {
    throw new Error('leftContent doit être un tableau');
  }
  
  if (!Array.isArray(slide.rightContent)) {
    throw new Error('rightContent doit être un tableau');
  }
  
  // Filter and normalize columns
  slide.leftContent = slide.leftContent
    .filter(item => isNonEmptyString(item))
    .map(item => item.trim())
    .slice(0, VALIDATION.MAX_COLUMN_POINTS);
  
  slide.rightContent = slide.rightContent
    .filter(item => isNonEmptyString(item))
    .map(item => item.trim())
    .slice(0, VALIDATION.MAX_COLUMN_POINTS);
  
  if (slide.leftContent.length < VALIDATION.MIN_COLUMN_POINTS ||
      slide.rightContent.length < VALIDATION.MIN_COLUMN_POINTS) {
    throw new Error('colonnes insuffisantes');
  }
  
  return slide;
}

function normalizeTableSlide(slide, slideNumber, warnings) {
  if (!isNonEmptyString(slide.title)) {
    throw new Error('titre manquant');
  }
  
  if (!Array.isArray(slide.tableData) || slide.tableData.length === 0) {
    throw new Error('tableData manquant ou vide');
  }
  
  // Validate and normalize table
  try {
    slide._normalizedTableData = normalizeTableDataSafe(slide.tableData);
  } catch (normError) {
    throw new Error(`normalisation tableau échouée: ${normError.message}`);
  }
  
  return slide;
}

function normalizeImageSlide(slide, slideNumber, warnings) {
  if (!isNonEmptyString(slide.title)) {
    throw new Error('titre manquant');
  }
  
  if (!isNonEmptyString(slide.imagePath)) {
    throw new Error('imagePath manquant');
  }
  
  if (!(isDataUri(slide.imagePath) || isPlaceholderUri(slide.imagePath))) {
    throw new Error('imagePath doit être data URI ou placeholder');
  }
  
  return slide;
}

/**
 * Common title validation for slides
 */
function validateSlideTitle(slide, slideNumber, errors) {
  if (!isNonEmptyString(slide.title)) {
    errors.push(`Slide ${slideNumber}: property 'title' is missing or empty`);
  } else if (slide.title.trim().length > VALIDATION.TITLE_MAX_LENGTH) {
    errors.push(`Slide ${slideNumber}: title cannot exceed ${VALIDATION.TITLE_MAX_LENGTH} characters (current: ${slide.title.trim().length})`);
  }
}
