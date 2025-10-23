/**
 * Table data normalization with robust error handling
 */

/**
 * Normalize table data to PptxGenJS format
 * Converts raw table data to format expected by the library
 * 
 * @param {Array<Array>} rows - Raw table data
 * @returns {Array<Array<Object>>} Normalized table data
 * @throws {Error} If table structure is invalid
 */
export function normalizeTableData(rows) {
  try {
    return normalizeTableDataSafe(rows);
  } catch (err) {
    console.error('Table normalization failed:', rows, err);
    // Return error placeholder
    return [[{
      text: 'ERREUR TABLE',
      options: { bold: true, fill: 'FC8181', color: 'FFFFFF' }
    }]];
  }
}

/**
 * Safe table normalization with comprehensive validation
 * 
 * @param {Array<Array>} rows - Raw table data
 * @returns {Array<Array<Object>>} Normalized table data
 * @throws {Error} If validation fails
 */
export function normalizeTableDataSafe(rows) {
  // Level 1: Validate array
  if (!Array.isArray(rows)) {
    throw new Error(`tableData must be an array (received: ${typeof rows})`);
  }
  
  // Level 2: Validate non-empty
  if (rows.length === 0) {
    throw new Error('tableData cannot be empty');
  }
  
  // Level 3: Validate header row
  if (!Array.isArray(rows[0])) {
    throw new Error(`First row (headers) must be an array (received: ${typeof rows[0]})`);
  }
  
  if (rows[0].length === 0) {
    throw new Error('Header row cannot be empty');
  }
  
  // Normalize each row
  return rows.map((row, rowIndex) => {
    // Handle non-array rows
    if (!Array.isArray(row)) {
      console.warn(`Row ${rowIndex} is not an array, forcing conversion`);
      row = [row];
    }
    
    // Normalize each cell
    return row.map(cell => {
      // If already formatted correctly, preserve it
      if (cell && typeof cell === 'object' && !Array.isArray(cell) && 'text' in cell) {
        return {
          text: String(cell.text ?? ''),
          options: cell.options || (rowIndex === 0 ? { 
            bold: true, 
            fill: 'E1E1E1', 
            color: '000000' 
          } : {})
        };
      }
      
      // Convert primitive to formatted object
      let textValue;
      
      if (cell === null || cell === undefined) {
        textValue = '';
      } else if (typeof cell === 'object') {
        // Weird object without 'text' → stringify
        textValue = JSON.stringify(cell);
      } else {
        textValue = String(cell);
      }
      
      return {
        text: textValue,
        options: rowIndex === 0 ? { 
          bold: true, 
          fill: 'E1E1E1', 
          color: '000000' 
        } : {}
      };
    });
  });
}
