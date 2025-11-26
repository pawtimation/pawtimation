/**
 * Geocoding service using Nominatim (OpenStreetMap)
 * Free, no API key required, worldwide coverage
 * Usage policy: 1 request/second, must include User-Agent
 * 
 * COMPLIANCE NOTE: Geocoding is disabled by default via ENABLE_MAPS flag
 * When disabled, returns null to prevent GPS data collection
 */

import fetch from 'node-fetch';
import { ENABLE_MAPS } from '../config.js';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const USER_AGENT = 'PawtimationCRM/1.0';

/**
 * Geocode an address to lat/lng coordinates
 * @param {string} address - Full address string
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodeAddress(address) {
  if (!ENABLE_MAPS) {
    console.log('[GEOCODING] Disabled - ENABLE_MAPS=false');
    return null;
  }

  if (!address || address.trim().length === 0) {
    return null;
  }

  try {
    const url = new URL(NOMINATIM_URL);
    url.searchParams.set('q', address.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      console.error('Geocoding API error:', response.status, response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data || data.length === 0) {
      console.log('No geocoding results found for address:', address);
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Build a full address string from client address fields
 */
export function buildFullAddress(client) {
  const parts = [];
  
  if (client.addressLine1) parts.push(client.addressLine1);
  if (client.city) parts.push(client.city);
  if (client.postcode) parts.push(client.postcode);
  
  return parts.join(', ');
}
