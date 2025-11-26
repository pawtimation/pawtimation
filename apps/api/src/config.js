import dotenv from 'dotenv'; dotenv.config();
export const API_PORT = process.env.PORT || process.env.API_PORT || 8787;

/**
 * Maps Feature Flag
 * When false: No geocoding, routing, or GPS data processing occurs
 * When true: Full mapping functionality enabled
 * Defaults to false for compliance safety
 */
export const ENABLE_MAPS = String(process.env.ENABLE_MAPS || '').toLowerCase() === 'true';

/**
 * Helper to check if maps are enabled
 */
export function isMapsEnabled() {
  return ENABLE_MAPS;
}
