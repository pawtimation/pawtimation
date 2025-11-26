/**
 * Maps Feature Flag (Frontend)
 * When false: No map UI, geocoding, or routing features are displayed
 * When true: Full mapping functionality enabled
 * Defaults to false for compliance safety
 */

/**
 * Check if maps feature is enabled
 * @returns {boolean} True if maps are enabled
 */
export function isMapsEnabled() {
  return String(import.meta.env.VITE_ENABLE_MAPS || '').toLowerCase() === 'true';
}

/**
 * Export as constant for simpler usage
 */
export const ENABLE_MAPS = isMapsEnabled();
