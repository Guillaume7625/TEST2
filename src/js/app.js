/**
 * Main application entry point
 */

import { loadPptxGenRobust, initializePptxGenPolling } from './pptxLoader.js';
import { generatePowerPoint, validateJSONOnly } from './generator.js';
import { initializeUI } from './ui.js';

// Load PptxGenJS library
loadPptxGenRobust();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI handlers
  initializeUI();
  
  // Initialize PptxGenJS polling
  initializePptxGenPolling();
  
  // Make functions globally available for onclick handlers
  window.generatePowerPoint = generatePowerPoint;
  window.validateJSONOnly = validateJSONOnly;
});
