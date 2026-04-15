/**
 * GlossCut — luxury minimal palette (Porsche-style inspection app).
 * Rules: no pure #000 / #FFF as page bg; accent #C8FF00 only for progress + key data highlights.
 */

export const Colors = {
  // Backgrounds
  BG_PAGE: '#F5F4F0',
  BG_CARD: '#FFFFFF',
  BG_HOVER: '#EBEBEA',
  BG_TAG: '#F0EFE9',
  BG_IMAGE_PLACEHOLDER: '#F0EFE9',

  // Borders & dividers
  BORDER_CARD: '#E8E7E2',
  BORDER_INPUT: '#E0DFDB',
  DIVIDER: '#D8D7D2',
  BORDER_STRONG: '#C8C7C2',

  // Dark primary (CTA / nav)
  CTA_BUTTON: '#1A1A1A',
  CTA_PRESSED: '#2E2E2E',
  NAV_BG: '#141414',
  DEEP_BLACK: '#141414',

  // Text
  TEXT_PRIMARY: '#1A1A1A',
  TEXT_SECONDARY: '#606058',
  TEXT_MUTED: '#A0A09A',
  TEXT_PLACEHOLDER: '#B0AFA8',
  TEXT_ON_DARK: '#FFFFFF',

  // Single accent — progress bars + rare metric / status highlights only
  ACCENT_PROGRESS: '#C8FF00',
  ACCENT_LIGHT: '#D4FF40',
  PROGRESS_BG: '#F0F0F0',

  // Status
  STATUS_OPEN: '#C8FF00',
  STATUS_ERROR: '#FF4444',
  INACTIVE: '#E8E7E2',

  // Legacy aliases (map old names → new system)
  CHARCOAL: '#1A1A1A',
  CHARCOAL_SOFT: '#2E2E2E',
  CHARCOAL_MUTED: '#606058',
  LIME_PRIMARY: '#C8FF00', // deprecated: use ACCENT_PROGRESS / STATUS_OPEN
  LIME_DARK: '#A0A09A',
  LIME_MUTED: '#F0EFE9',
  LIME_DEEP: '#606058',
  TEXT_ON_LIME: '#1A1A1A',
  LIME_ON_DARK: '#FFFFFF',
  WHITE: '#FFFFFF',
  DANGER: '#FF4444',
  /** Generic success (non-decorative); prefer TEXT_PRIMARY for emphasis */
  SUCCESS: '#606058'};
