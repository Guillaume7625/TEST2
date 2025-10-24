// Test the JSON sanitizer
const fs = require('fs');

// Read malformed JSON
const malformedJSON = fs.readFileSync('./test-json-errors.json', 'utf8');

console.log('=== MALFORMED JSON (INPUT) ===');
console.log(malformedJSON);
console.log('\n');

// Enhanced sanitizer function
function cleanJSONString(jsonString) {
  if (!jsonString || typeof jsonString !== 'string') {
    return '';
  }
  
  let cleaned = jsonString.trim();
  
  // 1. Remove BOM and invisible characters
  cleaned = cleaned.replace(/^\uFEFF/, '').replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // 2. Fix nested double quotes: ""text"" → "text"
  cleaned = cleaned.replace(/""\s*([^"]*)\s*""/g, '"$1"');
  
  // 3. Fix double quotes in arrays
  cleaned = cleaned.replace(/(\[\s*"[^"]*)""\ s*([^"]*)""\s*([^"]*")/g, '$1$2$3');
  
  // 4. Remove trailing commas
  cleaned = cleaned.replace(/,(\s*[\]}])/g, '$1');
  
  // 5. Add missing commas between strings
  cleaned = cleaned.replace(/"\s+"/g, '", "');
  
  // 6. Add missing commas between objects
  cleaned = cleaned.replace(/\}\s+\{/g, '}, {');
  
  // 7. Add missing commas between ] and {
  cleaned = cleaned.replace(/\]\s+\{/g, '], {');
  
  // 8. Fix escaped single quotes
  cleaned = cleaned.replace(/\\'/g, "'");
  
  // 9. Remove comments
  cleaned = cleaned.replace(/\/\/.*$/gm, '');
  cleaned = cleaned.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 10. Fix missing quotes around keys
  cleaned = cleaned.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');
  
  return cleaned;
}

const cleaned = cleanJSONString(malformedJSON);

console.log('=== CLEANED JSON (OUTPUT) ===');
console.log(cleaned);
console.log('\n');

// Try to parse
try {
  const parsed = JSON.parse(cleaned);
  console.log('✅ JSON PARSING: SUCCESS!');
  console.log('\n=== PARSED OBJECT ===');
  console.log(JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error('❌ JSON PARSING: FAILED!');
  console.error('Error:', error.message);
}
