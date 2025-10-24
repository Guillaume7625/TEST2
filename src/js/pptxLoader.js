/**
 * Robust PptxGenJS loader with multi-level fallback
 */

/**
 * Load PptxGenJS library with fallback mechanisms
 */
export function loadPptxGenRobust() {
  const container = document.getElementById('pptxgen-bundle-data');
  
  // === LEVEL 1: Try loading from embedded base64 ===
  if (container) {
    const base64 = container.textContent.replace(/\s+/g, '');
    
    // Check if placeholder has been replaced
    if (
      base64 &&
      base64 !== '<!--PPTX_BUNDLE_BASE64-->' &&
      base64.length > 10000 // Real bundle is ~636KB in base64
    ) {
      try {
        const scriptEl = document.createElement('script');
        scriptEl.type = 'text/javascript';
        scriptEl.textContent = atob(base64);
        document.head.appendChild(scriptEl);
        console.info('✓ PptxGenJS loaded from embedded base64');
        return;
      } catch (err) {
        console.warn('⚠️ Base64 decoding failed, trying fallback...', err);
      }
    } else {
      console.warn('⚠️ Base64 missing/invalid, trying fallback...');
    }
  }
  
  // === LEVEL 2: Fallback to external pptxgen.bundle.js ===
  const fallbackScript = document.createElement('script');
  fallbackScript.src = './pptxgen.bundle.js';
  fallbackScript.onerror = () => {
    console.error('❌ Failed to load external pptxgen.bundle.js');
    showCriticalError();
  };
  fallbackScript.onload = () => {
    console.info('✓ PptxGenJS loaded from external file (fallback)');
  };
  document.head.appendChild(fallbackScript);
  
  // === LEVEL 3: Show critical error if everything fails ===
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
            Critical Error: Missing Library
          </h1>
          <p style="font-size: 18px; line-height: 1.6; margin: 0 0 24px; opacity: 0.95;">
            The <code style="background: rgba(0,0,0,0.3); padding: 2px 8px; border-radius: 4px;">pptxgen.bundle.js</code>
            library could not be loaded.
          </p>
          <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; text-align: left; font-size: 14px;">
            <strong>Solutions:</strong><br>
            1. Verify that <code>pptxgen.bundle.js</code> is in the same folder<br>
            2. If using embedded version, check the base64 placeholder<br>
            3. Open console (F12) to see error details
          </div>
        </div>
      </div>
    `;
  }
}

/**
 * Check if PptxGenJS is available before generation
 * 
 * @returns {Object} PptxGenJS constructor
 * @throws {Error} If PptxGenJS is not available
 */
export function checkPptxGenAvailable() {
  if (typeof window.PptxGenJS === 'undefined' && typeof window.pptxgen === 'undefined') {
    throw new Error(
      'PptxGenJS is not available.\n' +
      'Verify that pptxgen.bundle.js is correctly loaded.\n' +
      'Reload the page or check the console for details.'
    );
  }
  // Normalize: some versions expose PptxGenJS, others pptxgen
  return window.PptxGenJS || window.pptxgen;
}

/**
 * Initialize PptxGenJS polling mechanism
 * Waits for library to be loaded before enabling UI
 */
export function initializePptxGenPolling() {
  const errorDiv = document.getElementById('error');
  const generateBtn = document.getElementById('generateBtn');
  let pollId = null;
  let hasLoggedTimeout = false;
  const startTime = Date.now();
  
  const clearAutoStatus = () => {
    if (errorDiv && errorDiv.dataset.autostatus === 'pptx-missing') {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
      delete errorDiv.dataset.autostatus;
    }
  };
  
  const enableGenerator = () => {
    if (generateBtn) {
      generateBtn.disabled = false;
      generateBtn.removeAttribute('aria-disabled');
    }
    clearAutoStatus();
  };
  
  const attempt = () => {
    try {
      checkPptxGenAvailable();
      enableGenerator();
      if (pollId) {
        clearInterval(pollId);
        pollId = null;
      }
      return true;
    } catch (err) {
      if (generateBtn) {
        generateBtn.disabled = true;
        generateBtn.setAttribute('aria-disabled', 'true');
      }
      
      const elapsed = Date.now() - startTime;
      const message = elapsed > 5000
        ? '❌ PptxGenJS library not detected. Verify that "pptxgen.bundle.js" is present locally and reload the page.'
        : 'ℹ️ Loading PptxGenJS library...';
      
      if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.dataset.autostatus = 'pptx-missing';
      }
      
      if (elapsed > 15000 && pollId) {
        clearInterval(pollId);
        pollId = null;
        if (!hasLoggedTimeout) {
          console.error(err);
          hasLoggedTimeout = true;
        }
      }
      return false;
    }
  };
  
  if (!attempt()) {
    pollId = setInterval(() => {
      if (attempt()) {
        if (pollId) {
          clearInterval(pollId);
          pollId = null;
        }
        return;
      }
      if (Date.now() - startTime > 15000 && pollId) {
        clearInterval(pollId);
        pollId = null;
      }
    }, 300);
  }
}
