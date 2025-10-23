/**
 * Utility functions for validation and data processing
 */

/**
 * Check if a value is a valid hex color (6 characters, no #)
 */
export function isHex6(value) {
  return typeof value === 'string' && /^[0-9A-Fa-f]{6}$/.test(value);
}

/**
 * Count words in a string
 */
export function countWords(text) {
  return String(text).trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Check if string is a data URI
 */
export function isDataUri(str) {
  return typeof str === 'string' && str.startsWith('data:image/');
}

/**
 * Check if string is a placeholder URI
 */
export function isPlaceholderUri(str) {
  return typeof str === 'string' && str.startsWith('IMAGE_PLACEHOLDER_');
}

/**
 * Check if value is a non-empty string
 */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Sanitize filename for safe file system usage
 */
export function sanitizeFilename(filename) {
  if (!filename) return `presentation-${Date.now()}.pptx`;
  
  // Ensure .pptx extension
  if (!filename.toLowerCase().endsWith('.pptx')) {
    filename += '.pptx';
  }
  
  return filename;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
