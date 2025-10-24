/**
 * UI interaction handlers
 */

import { OPTIMAL_PROMPT } from './prompt.js';

/**
 * Toggle prompt visibility
 */
export function togglePrompt() {
  const box = document.getElementById('promptBox');
  const txt = document.getElementById('promptText');
  
  if (box.style.display === 'none') {
    box.style.display = 'block';
    txt.value = OPTIMAL_PROMPT;
  } else {
    box.style.display = 'none';
  }
}

/**
 * Copy prompt to clipboard with fallback mechanisms
 */
export async function copyPrompt() {
  const txt = document.getElementById('promptText');
  const fb = document.getElementById('copyFeedback');
  
  if (!txt || !fb) return;
  
  const defaultMessage = fb.dataset.defaultMessage || '✓ Prompt copied to clipboard!';
  const fallbackMessage = 'Automatic copy unavailable. Select the text then use Ctrl+C (Cmd+C on Mac).';
  
  const showFeedback = (message, isError = false) => {
    fb.textContent = message;
    fb.style.color = isError ? '#c53030' : '#38a169';
    fb.style.display = 'block';
    
    clearTimeout(fb._timeoutId);
    fb._timeoutId = window.setTimeout(() => {
      fb.style.display = 'none';
      fb.style.color = '#38a169';
      fb.textContent = defaultMessage;
    }, 3000);
  };
  
  // Try modern clipboard API
  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      await navigator.clipboard.writeText(txt.value);
      showFeedback(defaultMessage);
      return;
    }
  } catch (err) {
    // Continue to fallback mechanisms
  }
  
  // Fallback: try execCommand
  try {
    txt.focus();
    txt.select();
    if (typeof txt.setSelectionRange === 'function') {
      txt.setSelectionRange(0, txt.value.length);
    }
    
    const successful = document.execCommand && document.execCommand('copy');
    if (successful) {
      showFeedback(defaultMessage);
    } else {
      throw new Error('execCommand copy unsuccessful');
    }
  } catch (err) {
    // Final fallback: just select the text
    txt.focus();
    txt.select();
    if (typeof txt.setSelectionRange === 'function') {
      txt.setSelectionRange(0, txt.value.length);
    }
    showFeedback(fallbackMessage, true);
  }
}

/**
 * Toggle collapsible section
 */
export function toggleCollapsible(header) {
  const content = header.nextElementSibling;
  const arrow = header.querySelector('span:last-child');
  
  content.classList.toggle('active');
  arrow.textContent = content.classList.contains('active') ? '▲' : '▼';
}

/**
 * Initialize UI event listeners
 */
export function initializeUI() {
  // Make functions globally available for inline onclick handlers
  window.togglePrompt = togglePrompt;
  window.copyPrompt = copyPrompt;
  window.toggleCollapsible = toggleCollapsible;
}
