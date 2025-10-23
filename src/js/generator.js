/**
 * PowerPoint generation with MAXIMUM ROBUSTNESS
 * - Defensive slide-by-slide generation
 * - Auto-sanitization and validation
 * - Never crashes, always generates something
 * - Clear feedback on what succeeded/failed
 */

import { validateJSON, validateJSONInput } from './validator.js';
import { checkPptxGenAvailable } from './pptxLoader.js';
import { 
  createTitleSlide, 
  createContentSlide, 
  createTwoColumnSlide, 
  createTableSlide, 
  createImageSlide 
} from './slideCreators.js';

/**
 * Generate PowerPoint presentation from JSON data
 * Features progressive UI updates for better UX
 */
export async function generatePowerPoint() {
  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');
  const warningDiv = document.getElementById('warning');
  const btn = document.getElementById('generateBtn');
  const spin = document.getElementById('genSpin');
  const label = document.getElementById('genLabel');
  
  const updateWarningPanel = (list = []) => {
    if (!warningDiv) return;
    if (!Array.isArray(list) || list.length === 0) {
      warningDiv.style.display = 'none';
      warningDiv.textContent = '';
    } else {
      warningDiv.textContent = '⚠️ Avertissements :\n' + list.map(item => '• ' + item).join('\n');
      warningDiv.style.display = 'block';
    }
  };
  
  // Reset UI
  if (errorDiv) {
    errorDiv.removeAttribute('data-autostatus');
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
  if (successDiv) {
    successDiv.style.display = 'none';
    successDiv.textContent = '';
  }
  updateWarningPanel([]);
  
  let warningsToDisplay = [];
  let slidesGenerated = 0;
  let slidesSkipped = 0;
  
  try {
    // LAYER 7: Preflight Check - PptxGenJS availability
    const PptxGenJS = checkPptxGenAvailable();
    if (typeof PptxGenJS !== 'function') {
      throw new Error('⚠️ PptxGenJS non disponible. Veuillez recharger la page.');
    }
    
    // Get JSON input
    const jsonInputEl = document.getElementById('jsonInput');
    const jsonInput = jsonInputEl ? jsonInputEl.value.trim() : '';
    
    if (!jsonInput) {
      throw new Error('Veuillez coller du contenu JSON avant de générer.');
    }
    
    // LAYER 8: Use tolerant validation with auto-sanitization
    const validationResult = validateJSONInput(jsonInput);
    
    // Collect all warnings (from sanitization + validation)
    warningsToDisplay = validationResult.warnings || [];
    
    // If validation failed with errors, show them
    if (!validationResult.valid || !validationResult.data) {
      const errorMessage = validationResult.errors && validationResult.errors.length > 0
        ? validationResult.errors.join('\n\n')
        : 'Validation du JSON échouée.';
      throw new Error(errorMessage);
    }
    
    const data = validationResult.data;
    
    // Set UI to busy state
    if (btn) btn.disabled = true;
    if (spin) spin.style.display = 'inline-block';
    if (label) label.textContent = 'Préparation de la présentation...';
    
    // Create presentation
    const pptx = new PptxGenJS();
    pptx.author = data.metadata.author || 'Auteur';
    pptx.title = data.metadata.title || 'Présentation';
    pptx.company = data.metadata.company || '';
    pptx.subject = data.metadata.subject || '';
    pptx.layout = 'LAYOUT_16x9';
    
    const totalSlides = data.slides.length;
    
    // DEFENSIVE: Generate slides one-by-one with try/catch
    for (let i = 0; i < totalSlides; i++) {
      const slideData = data.slides[i];
      
      // Update progress label
      if (label) {
        label.textContent = `Génération slide ${i + 1}/${totalSlides}...`;
      }
      
      // Micro-yield every 3 slides for responsive UI
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      try {
        const slide = pptx.addSlide();
        
        // DEFENSIVE: Try to create slide, catch individual errors
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
            throw new Error(`Type de slide inconnu: "${slideData.type}"`);
        }
        
        slidesGenerated++;
        
      } catch (slideError) {
        slidesSkipped++;
        const slideWarning = `⚠️ Slide ${i + 1} (${slideData.type}) ignorée: ${slideError.message}`;
        console.warn(slideWarning, slideError);
        warningsToDisplay.push(slideWarning);
      }
    }
    
    // Check if any slides were successfully generated
    if (slidesGenerated === 0) {
      throw new Error('❌ Aucune slide n\\'a pu être générée. Vérifiez votre JSON.');
    }
    
    // Finalize file
    if (label) {
      label.textContent = 'Finalisation du fichier...';
    }
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const fileName = data.metadata.fileName || `presentation-${Date.now()}.pptx`;
    await pptx.writeFile({ fileName });
    
    // Success message with statistics
    let successMessage = `✅ PowerPoint généré : ${fileName}\\n`;
    successMessage += `📊 ${slidesGenerated} slide(s) créée(s)`;
    if (slidesSkipped > 0) {
      successMessage += `, ${slidesSkipped} ignorée(s)`;
    }
    
    if (successDiv) {
      successDiv.textContent = successMessage;
      successDiv.style.display = 'block';
    }
    
    updateWarningPanel(warningsToDisplay);
    
  } catch (err) {
    // NEVER crash - always show user-friendly error
    let errorMessage = err.message || 'Erreur inconnue';
    
    // Add statistics if some slides were generated before error
    if (slidesGenerated > 0) {
      errorMessage += `\\n\\n📊 ${slidesGenerated} slide(s) générée(s) avant l'erreur`;
    }
    
    if (errorDiv) {
      errorDiv.textContent = '❌ ' + errorMessage;
      errorDiv.style.display = 'block';
    }
    
    updateWarningPanel(warningsToDisplay);
    console.error('Erreur génération PowerPoint:', err);
    
  } finally {
    // ALWAYS reset UI
    if (btn) {
      btn.disabled = false;
    }
    if (spin) {
      spin.style.display = 'none';
    }
    if (label) {
      label.textContent = '🚀 Générer PowerPoint';
    }
  }
}

/**
 * Validate JSON only (without generating PowerPoint)
 * Provides preview of sanitization and validation results
 */
export function validateJSONOnly() {
  const errorDiv = document.getElementById('error');
  const successDiv = document.getElementById('success');
  const warningDiv = document.getElementById('warning');
  
  const updateWarningPanel = (list = []) => {
    if (!warningDiv) return;
    if (!Array.isArray(list) || list.length === 0) {
      warningDiv.style.display = 'none';
      warningDiv.textContent = '';
    } else {
      warningDiv.textContent = '⚠️ Avertissements :\n' + list.map(item => '• ' + item).join('\n');
      warningDiv.style.display = 'block';
    }
  };
  
  // Reset UI
  if (errorDiv) {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
  }
  if (successDiv) {
    successDiv.style.display = 'none';
    successDiv.textContent = '';
  }
  updateWarningPanel([]);
  
  try {
    const jsonInputEl = document.getElementById('jsonInput');
    const jsonInput = jsonInputEl ? jsonInputEl.value.trim() : '';
    
    if (!jsonInput) {
      throw new Error('Veuillez coller du contenu JSON avant de valider.');
    }
    
    // Use tolerant validation
    const result = validateJSONInput(jsonInput);
    
    if (!result.valid) {
      const errorMessage = result.errors && result.errors.length > 0
        ? result.errors.join('\n\n')
        : 'Validation échouée.';
      throw new Error(errorMessage);
    }
    
    // Success
    let successMessage = '✅ JSON valide !';
    
    if (result.data && result.data.slides) {
      successMessage += `\n📊 ${result.data.slides.length} slide(s) détectée(s)`;
    }
    
    if (successDiv) {
      successDiv.textContent = successMessage;
      successDiv.style.display = 'block';
    }
    
    // Show warnings/corrections
    updateWarningPanel(result.warnings || []);
    
  } catch (err) {
    if (errorDiv) {
      errorDiv.textContent = '❌ ' + err.message;
      errorDiv.style.display = 'block';
    }
    console.error('Erreur validation JSON:', err);
  }
}
