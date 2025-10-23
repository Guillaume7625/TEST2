/**
 * Fonction generatePowerPoint avec feedback progressif
 * Remplace la version actuelle dans le HTML
 */

async function generatePowerPoint() {
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
  errorDiv.style.display = 'none'; 
  errorDiv.textContent = '';
  successDiv.style.display = 'none'; 
  successDiv.textContent = '';
  updateWarningPanel([]);

  let warningsToDisplay = [];

  try {
    // ✅ AJOUT : Vérification PptxGenJS avant tout
    const PptxGenJS = checkPptxGenAvailable();
    
    const jsonInput = document.getElementById('jsonInput').value.trim();
    if (!jsonInput) {
      throw new Error('Veuillez coller du contenu JSON avant de générer');
    }
    
    let data;
    try { 
      data = JSON.parse(jsonInput); 
    } catch (e) { 
      throw new Error('JSON invalide : ' + e.message); 
    }

    // Validation
    const { errors, warns } = validateJSON(data);
    warningsToDisplay = Array.isArray(warns) ? warns.filter(Boolean) : [];
    
    if (errors.length) {
      throw new Error('Erreurs de validation :\n' + errors.map(e => '• ' + e).join('\n'));
    }

    // UI busy state
    btn.disabled = true; 
    spin.style.display = 'inline-block';

    // ✅ AMÉLIORATION : Création présentation avec feedback progressif
    const pptx = new PptxGenJS();
    pptx.author = data.metadata.author || 'Auteur';
    pptx.title = data.metadata.title || '';
    pptx.company = data.metadata.company || '';
    pptx.subject = data.metadata.subject || '';
    pptx.layout = 'LAYOUT_16x9';

    // ✅ NOUVEAU : Boucle for...of avec micro-yields pour UI responsive
    const totalSlides = data.slides.length;
    
    for (let i = 0; i < totalSlides; i++) {
      const slideData = data.slides[i];
      
      // ✅ Mise à jour label avec progression
      label.textContent = `Génération slide ${i + 1}/${totalSlides}...`;
      
      // ✅ Micro-yield : laisse le navigateur peindre l'UI
      // setTimeout(0) ou Promise.resolve() permettent au thread de respirer
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

    // Export final
    label.textContent = 'Finalisation du fichier...';
    await new Promise(resolve => setTimeout(resolve, 0)); // Dernier yield avant export
    
    const fileName = data.metadata.fileName || `presentation-${Date.now()}.pptx`;
    await pptx.writeFile({ fileName });

    // Succès
    successDiv.textContent = `✓ Présentation générée avec succès : ${fileName}`;
    successDiv.style.display = 'block';
    updateWarningPanel(warningsToDisplay);
    
  } catch (err) {
    errorDiv.textContent = '❌ ' + err.message;
    errorDiv.style.display = 'block';
    updateWarningPanel(warningsToDisplay);
    console.error('Erreur génération PowerPoint:', err);
    
  } finally {
    // ✅ Reset UI toujours exécuté
    btn.disabled = false; 
    spin.style.display = 'none'; 
    label.textContent = '🚀 Générer PowerPoint';
  }
}

/**
 * ALTERNATIVE : Si setTimeout(0) cause des ralentissements perceptibles,
 * utiliser requestAnimationFrame pour yield plus léger
 */
async function generatePowerPointOptimized() {
  // ... [même code jusqu'à la boucle] ...
  
  for (let i = 0; i < totalSlides; i++) {
    const slideData = data.slides[i];
    label.textContent = `Génération slide ${i + 1}/${totalSlides}...`;
    
    // ✅ ALTERNATIVE : requestAnimationFrame au lieu de setTimeout
    // Plus performant car synchronisé avec le rendu navigateur
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    const slide = pptx.addSlide();
    // ... [création slide] ...
  }
  
  // ... [reste du code] ...
}

/**
 * NOTES IMPLÉMENTATION :
 * 
 * 1. setTimeout(0) vs requestAnimationFrame :
 *    - setTimeout(0) : ~4ms de délai minimum, simple et universel
 *    - requestAnimationFrame : ~16ms (60fps), meilleur pour animations
 *    → Pour ce cas, setTimeout(0) est optimal
 * 
 * 2. Pourquoi le yield est nécessaire :
 *    - Sans yield : la boucle bloque le thread → UI freeze
 *    - Avec yield : chaque itération libère le thread → label se met à jour
 * 
 * 3. Impact performance :
 *    - 15 slides × 4ms = ~60ms overhead total (négligeable)
 *    - Gain UX : utilisateur voit progression en temps réel
 */
