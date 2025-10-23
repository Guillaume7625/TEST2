/**
 * Constants for PowerPoint Generator
 * Defines layout dimensions, zones, and validation rules
 */

// Layout constants (16:9 format)
export const LAYOUT = {
  width: 10,
  height: 5.625,
  margin: 0.5,
  titleHeight: 0.7,
  contentGap: 0.2,
  columnGap: 0.3,
  bulletIndent: 0.25
};

// Zone definitions for slide content
export const ZONES = {
  title: {
    x: LAYOUT.margin,
    y: LAYOUT.margin,
    w: LAYOUT.width - (2 * LAYOUT.margin),
    h: LAYOUT.titleHeight
  },
  content: {
    x: LAYOUT.margin + LAYOUT.bulletIndent,
    y: LAYOUT.margin + LAYOUT.titleHeight + LAYOUT.contentGap,
    w: LAYOUT.width - (2 * LAYOUT.margin) - LAYOUT.bulletIndent,
    h: LAYOUT.height - (LAYOUT.margin + LAYOUT.titleHeight + LAYOUT.contentGap + LAYOUT.margin)
  }
};

// Validation constants
export const VALIDATION = {
  TITLE_MAX_LENGTH: 60,
  MAX_BULLET_WORDS: 15,
  COLUMN_WORD_LIMIT: 15,
  MAX_TABLE_COLUMNS: 4,
  MAX_TABLE_ROWS: 10,
  MIN_BULLETS: 3,
  MAX_BULLETS: 5,
  MIN_COLUMN_POINTS: 2,
  MAX_COLUMN_POINTS: 4
};

// Filename validation pattern
export const FILENAME_PATTERN = /^[a-z0-9_-][a-z0-9._-]*\.pptx$/i;

// Valid slide types
export const VALID_SLIDE_TYPES = ['title', 'content', 'twoColumn', 'table', 'image'];
