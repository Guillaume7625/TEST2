# CommonJS/ES Module Interop Fix

## Problem

The PptxGenJS library uses the `_interopDefaultLegacy()` pattern for CommonJS/ES module compatibility:

```javascript
var JSZip = require('jszip');
var JSZip__default = _interopDefaultLegacy(JSZip);

function _interopDefaultLegacy(e) { 
  return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; 
}
```

### Previous Implementation (BROKEN)

```javascript
var require = function(name) {
  if (name === "jszip") return JSZip;  // ❌ Wrong!
  throw new Error("Module not found: " + name);
};
```

**Result:** Double wrapping issue
1. `require('jszip')` returns `JSZip` object
2. `_interopDefaultLegacy(JSZip)` checks if `'default' in JSZip`
3. Since `JSZip` doesn't have a `default` property, it wraps it: `{ default: JSZip }`
4. Code tries to use `JSZip__default.default` → causes error "JSZip__default.default is not a constructor"

### Fixed Implementation (CORRECT)

```javascript
var require = function(name) {
  if (name === "jszip") return { default: JSZip };  // ✅ Correct!
  throw new Error("Module not found: " + name);
};
```

**Result:** Proper interop
1. `require('jszip')` returns `{ default: JSZip }`
2. `_interopDefaultLegacy({ default: JSZip })` checks if `'default' in { default: JSZip }`
3. Since the `default` property exists, it returns the object as-is
4. Code uses `JSZip__default.default` → correctly accesses the JSZip constructor ✅

## File Location

- **File:** `build-standalone.js`
- **Line:** 108
- **Function:** `bundleModules()`

## Verification

```bash
# Rebuild
npm run build:standalone

# Test in browser console
typeof PptxGenJS              // "function" ✅
new PptxGenJS()               // Instance created ✅
pptx.addSlide()               // Slide created ✅
slide.addText('Test', {...})  // Text added ✅
```

## Key Insight

The `_interopDefaultLegacy()` function is designed to handle both:
- **ES modules** with explicit `default` export: `{ default: Constructor }`
- **CommonJS modules**: Raw `Constructor`

By returning `{ default: JSZip }` from our mock `require()`, we make JSZip appear 
as an ES module with a default export, which the interop function handles correctly 
without additional wrapping.

## Testing Result

✅ **Browser Console:** "SUCCESS: PptxGenJS is fully functional!"

## References

- Commit: 9390660
- PR: https://github.com/Guillaume7625/TEST2/pull/1
- Build output: 1053 KB bundle with full PowerPoint generation capability
