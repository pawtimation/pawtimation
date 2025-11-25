/**
 * Radius-based loop route generator for staff walks
 * 
 * Algorithm:
 * 1. Convert duration to target distance (4.5 km/h pace)
 * 2. Calculate radius from circumference: radius = (distance / 2π) * 0.8
 * 3. Generate 8 waypoints around the circle at ~45° intervals
 * 4. Final destination is near home but NOT identical (prevents Google Maps confusion)
 */

const WALK_SPEED_KMH = 4.5;
const LOOP_SEGMENTS = 8;
const EARTH_RADIUS_KM = 6371;

/**
 * Calculate a new coordinate given start point, distance, and bearing
 * Uses Haversine/great-circle formula
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
 * Calculate distance between two points in meters
 */
function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Generate a loop route from start coordinates and duration
 * Returns { origin, destination, waypoints }
 */
function generateLoopRoute(startLat, startLng, durationMinutes) {
  // Step 1: Calculate target distance from duration
  const targetDistanceKm = (durationMinutes / 60) * WALK_SPEED_KMH;
  
  // Step 2: Calculate radius from circumference
  // circumference = 2 * π * r, so r = circumference / (2 * π)
  // Apply 0.8 factor because actual path won't be a perfect circle
  const radiusKm = (targetDistanceKm / (2 * Math.PI)) * 0.8;
  
  console.log(`generateLoopRoute: ${durationMinutes}min = ${targetDistanceKm.toFixed(2)}km target, radius=${radiusKm.toFixed(3)}km`);
  
  // Step 3: Generate waypoints around the circle
  // Use 8 segments with ~45° spacing, add small random jitter
  const waypoints = [];
  const angleStep = 360 / LOOP_SEGMENTS;
  
  for (let i = 0; i < LOOP_SEGMENTS; i++) {
    // Add small jitter to make it less mechanical (-5° to +5°)
    const jitter = (Math.random() - 0.5) * 10;
    const bearing = (i * angleStep) + jitter;
    
    // Small radius variation for natural feel (0.9 to 1.1 of base radius)
    const radiusVariation = 0.9 + (Math.random() * 0.2);
    const pointRadius = radiusKm * radiusVariation;
    
    const point = offsetCoordinate(startLat, startLng, pointRadius, bearing);
    waypoints.push(point);
  }
  
  // Step 4: Ensure final point is near but NOT identical to start
  // Take the last waypoint and adjust if too close
  let destination = waypoints.pop(); // Remove last point as destination
  
  const distToHome = distanceMeters(startLat, startLng, destination.lat, destination.lng);
  
  if (distToHome < 30) {
    // Too close - nudge it outward by 50 meters at same bearing
    const bearing = Math.atan2(
      destination.lng - startLng,
      destination.lat - startLat
    ) * 180 / Math.PI;
    destination = offsetCoordinate(startLat, startLng, 0.05, bearing);
    console.log(`Destination too close (${distToHome.toFixed(0)}m), nudged to 50m`);
  }
  
  console.log(`Generated ${waypoints.length} waypoints, destination ${distanceMeters(startLat, startLng, destination.lat, destination.lng).toFixed(0)}m from home`);
  
  return {
    origin: { lat: startLat, lng: startLng },
    destination,
    waypoints
  };
}

/**
 * Build Google Maps walking directions URL
 */
function buildGoogleMapsWalkingUrl(origin, destination, waypoints) {
  const originStr = `${origin.lat.toFixed(6)},${origin.lng.toFixed(6)}`;
  const destStr = `${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`;
  
  // Build waypoints string (max 23 waypoints, we only use 7)
  const waypointsStr = waypoints
    .map(wp => `${wp.lat.toFixed(6)},${wp.lng.toFixed(6)}`)
    .join('|');
  
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
    const { origin, destination, waypoints } = generateLoopRoute(startLat, startLng, durationMinutes);
    const url = buildGoogleMapsWalkingUrl(origin, destination, waypoints);
    
    console.log('buildNavigationURL: Success');
    console.log(`Origin: ${origin.lat.toFixed(6)}, ${origin.lng.toFixed(6)}`);
    console.log(`Waypoints: ${waypoints.length}`);
    console.log(`Destination: ${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`);
    
    return url;
  } catch (error) {
    console.error('buildNavigationURL: Failed', error);
    return null;
  }
}
