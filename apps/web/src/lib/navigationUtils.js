/**
 * Realistic loop route generator for dog walks
 * 
 * Algorithm:
 * 1. Convert duration to target distance (4 km/h dog-walking pace)
 * 2. radiusKm = targetKm / 2 (outward uses half, Google's return completes the loop)
 * 3. Generate exactly 3 waypoints at 45°, 135°, 225° with jitter
 * 4. Destination is 30m from home (NOT identical to origin)
 * 5. Google handles the return path naturally
 */

const WALK_SPEED_KMH = 4; // Dog-walking pace
const EARTH_RADIUS_KM = 6371;

/**
 * Convert km + angle to lat/lng offset from a starting point
 */
function offsetCoordinate(lat, lng, distanceKm, bearingDeg) {
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;
  const bearingRad = bearingDeg * Math.PI / 180;
  const angularDistance = distanceKm / EARTH_RADIUS_KM;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearingRad)
  );

  const newLngRad = lngRad + Math.atan2(
    Math.sin(bearingRad) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return {
    lat: newLatRad * 180 / Math.PI,
    lng: newLngRad * 180 / Math.PI
  };
}

/**
 * Apply random jitter to an angle (±10 degrees)
 */
function jitterAngle(baseDeg) {
  return baseDeg + (Math.random() - 0.5) * 20; // -10 to +10
}

/**
 * Apply random jitter to distance (±15%)
 */
function jitterDistance(baseKm) {
  return baseKm * (0.85 + Math.random() * 0.3); // 0.85 to 1.15
}

/**
 * Generate realistic walking route
 * 
 * @param {number} homeLat - Home latitude
 * @param {number} homeLng - Home longitude
 * @param {number} minutes - Walk duration in minutes
 * @returns {{ origin, destination, waypoints }}
 */
function generateRealisticRoute(homeLat, homeLng, minutes) {
  // Step 1: Calculate target distance and radius
  const targetKm = (minutes / 60) * WALK_SPEED_KMH;
  const radiusKm = targetKm / 2;
  
  console.log(`generateRealisticRoute: ${minutes}min = ${targetKm.toFixed(2)}km target, radius=${radiusKm.toFixed(3)}km`);
  
  // Step 2: Generate exactly 3 waypoints at fixed base angles with jitter
  const baseAngles = [45, 135, 225];
  const waypoints = [];
  
  for (const baseAngle of baseAngles) {
    const angle = jitterAngle(baseAngle);
    const distance = jitterDistance(radiusKm);
    const point = offsetCoordinate(homeLat, homeLng, distance, angle);
    waypoints.push(point);
    console.log(`Waypoint at ${angle.toFixed(0)}deg, ${(distance * 1000).toFixed(0)}m: ${point.lat.toFixed(6)}, ${point.lng.toFixed(6)}`);
  }
  
  // Step 3: Create destination ~30m from home (NOT identical)
  // Offset at 315° (northwest) by 30 meters
  const destination = offsetCoordinate(homeLat, homeLng, 0.03, 315);
  
  console.log(`Origin: ${homeLat.toFixed(6)}, ${homeLng.toFixed(6)}`);
  console.log(`Destination (30m away): ${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`);
  
  return {
    origin: { lat: homeLat, lng: homeLng },
    destination,
    waypoints
  };
}

/**
 * Build Google Maps walking directions URL
 * 
 * IMPORTANT:
 * - Do NOT set origin = destination (Google rejects pure loops)
 * - Do NOT use optimize=true (preserves waypoint order)
 * - Maximum 3 waypoints for cleaner routing
 */
function buildGoogleMapsWalkingUrl(origin, destination, waypoints) {
  const originStr = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
  const destStr = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
  
  // Join waypoints with | separator
  const waypointsStr = waypoints
    .map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`)
    .join('|');
  
  // Build URL with walking mode, no optimization
  const url = `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(originStr)}` +
    `&destination=${encodeURIComponent(destStr)}` +
    `&waypoints=${encodeURIComponent(waypointsStr)}` +
    `&travelmode=walking`;
  
  return url;
}

/**
 * Main export: Build navigation URL for a walking loop
 * 
 * @param {number} clientLat - Client home latitude
 * @param {number} clientLng - Client home longitude  
 * @param {any} routeCoordinates - Ignored (kept for API compatibility)
 * @param {number} durationMinutes - Walk duration in minutes
 * @returns {string|null} Google Maps URL or null if invalid
 */
export function buildNavigationURL(clientLat, clientLng, routeCoordinates, durationMinutes = 30) {
  const startLat = parseFloat(clientLat);
  const startLng = parseFloat(clientLng);
  
  if (isNaN(startLat) || isNaN(startLng)) {
    console.error('buildNavigationURL: Invalid coordinates', { clientLat, clientLng });
    return null;
  }
  
  try {
    const { origin, destination, waypoints } = generateRealisticRoute(startLat, startLng, durationMinutes);
    const url = buildGoogleMapsWalkingUrl(origin, destination, waypoints);
    
    console.log('buildNavigationURL: Generated URL successfully');
    return url;
  } catch (error) {
    console.error('buildNavigationURL: Failed', error);
    return null;
  }
}
