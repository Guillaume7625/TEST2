/**
 * Loader PptxGenJS robuste avec fallback multi-niveaux
 * À intégrer dans <head> du HTML à la place du loader actuel
 */

(function loadPptxGenRobust() {
  const container = document.getElementById('pptxgen-bundle-data');
  
  // === NIVEAU 1 : Tentative chargement depuis base64 embarqué ===
  if (container) {
    const base64 = container.textContent.replace(/\s+/g, '');
    
    // Vérification que le placeholder a été remplacé
    if (base64 && 
        base64 !== '<!--PPTX_BUNDLE_BASE64-->' && 
        base64.length > 10000) { // Bundle réel fait ~636KB en base64
      
      try {
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.textContent = atob(base64);
        document.head.appendChild(scriptEl);
        console.info('✓ PptxGenJS chargé depuis base64 embarqué');
        return; // Succès
      } catch (err) {
        console.warn('⚠️ Échec décodage base64, tentative fallback...', err);
      }
    } else {
      console.warn('⚠️ Base64 manquant/invalide, tentative fallback...');
    }
  }

  // === NIVEAU 2 : Fallback vers fichier externe pptxgen.bundle.js ===
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

  // === NIVEAU 3 : Affichage erreur critique si tout échoue ===
  function showCriticalError() {
    document.body.innerHTML = `
      <div style="
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: linear-gradient(135deg, #fc8181 0%, #c53030 100%);
        color: white; display: flex; align-items: center; justify-content: center;
        font-family: system-ui, -apple-system, sans-serif; padding: 40px; z-index: 9999;
      ">
        <div style="max-width: 600px; text-align: center;">
          <div style="font-size: 72px; margin-bottom: 20px;">⚠️</div>
          <h1 style="font-size: 28px; margin: 0 0 16px; font-weight: 700;">
            Erreur Critique : Bibliothèque Manquante
          </h1>
          <p style="font-size: 18px; line-height: 1.6; margin: 0 0 24px; opacity: 0.95;">
            La bibliothèque <code style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px;">pptxgen.bundle.js</code> 
            n'a pas pu être chargée.
          </p>
          <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; text-align: left; font-size: 14px;">
            <strong>Solutions :</strong><br>
            1. Vérifiez que <code>pptxgen.bundle.js</code> est dans le même dossier<br>
            2. Si vous utilisez la version embarquée, vérifiez le placeholder base64<br>
            3. Ouvrez la console (F12) pour voir les détails de l'erreur
          </div>
        </div>
      </div>
    `;
  }
})();

/**
 * Vérification de disponibilité PptxGenJS avant génération
 * À appeler au début de generatePowerPoint()
 */
function checkPptxGenAvailable() {
  if (typeof window.PptxGenJS === 'undefined' && typeof window.pptxgen === 'undefined') {
    throw new Error(
      'PptxGenJS n\'est pas disponible.\n' +
      'Vérifiez que pptxgen.bundle.js est correctement chargé.\n' +
      'Rechargez la page ou consultez la console pour plus de détails.'
    );
  }
  // Normalisation : certaines versions exposent PptxGenJS, d'autres pptxgen
  return window.PptxGenJS || window.pptxgen;
}
