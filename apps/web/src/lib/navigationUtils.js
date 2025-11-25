/**
 * Navigation URL builder for circular walking routes
 * 
 * Strategy: Set destination to a point ~10m from home (not exactly home).
 * This tricks Google Maps into showing the full circular route with 
 * turn-by-turn navigation. The turnaround point is included as a waypoint.
 */
export function buildNavigationURL(clientLat, clientLng, routeCoordinates) {
  const startLat = parseFloat(clientLat);
  const startLng = parseFloat(clientLng);
  
  if (isNaN(startLat) || isNaN(startLng)) {
    console.error('buildNavigationURL: Invalid client coordinates', { clientLat, clientLng });
    return null;
  }

  const coords = routeCoordinates || [];
  
  if (!Array.isArray(coords) || coords.length === 0) {
    console.warn('buildNavigationURL: No route coordinates, cannot navigate');
    return null;
  }
  
  // Parse and validate all coordinates (GeoJSON format: [lng, lat])
  const validCoords = coords
    .filter(coord => Array.isArray(coord) && coord.length >= 2)
    .map(coord => ({
      lng: parseFloat(coord[0]),
      lat: parseFloat(coord[1])
    }))
    .filter(c => !isNaN(c.lat) && !isNaN(c.lng));
  
  if (validCoords.length === 0) {
    console.warn('buildNavigationURL: No valid coordinates found');
    return null;
  }
  
  // Find the farthest point from start - this is the turnaround point
  let farthestIdx = 0;
  let maxDistance = 0;
  
  validCoords.forEach((coord, idx) => {
    const dist = Math.sqrt(
      Math.pow(coord.lat - startLat, 2) + 
      Math.pow(coord.lng - startLng, 2)
    );
    if (dist > maxDistance) {
      maxDistance = dist;
      farthestIdx = idx;
    }
  });
  
  const farthestPoint = validCoords[farthestIdx];
  
  // Create destination ~10m from home (offset by ~0.0001 degrees)
  // This prevents Google Maps from collapsing origin=destination
  const nearHomeLat = startLat + 0.0001;
  const nearHomeLng = startLng + 0.0001;
  
  // Sample waypoints: take points at regular intervals along the route
  // Google Maps allows max 23 waypoints
  const maxWaypoints = 10; // Keep it simple with fewer points for cleaner route
  let waypoints = [];
  
  if (validCoords.length <= maxWaypoints) {
    waypoints = validCoords.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`);
  } else {
    // Sample evenly, but always include the turnaround point
    const step = validCoords.length / (maxWaypoints - 1);
    for (let i = 0; i < maxWaypoints - 1; i++) {
      const idx = Math.min(Math.floor(i * step), validCoords.length - 1);
      const c = validCoords[idx];
      waypoints.push(`${c.lat.toFixed(6)},${c.lng.toFixed(6)}`);
    }
    // Always include the farthest point
    if (!waypoints.includes(`${farthestPoint.lat.toFixed(6)},${farthestPoint.lng.toFixed(6)}`)) {
      waypoints.push(`${farthestPoint.lat.toFixed(6)},${farthestPoint.lng.toFixed(6)}`);
    }
  }
  
  // Build URL: origin (home) -> waypoints -> destination (near home)
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const destination = encodeURIComponent(`${nearHomeLat.toFixed(6)},${nearHomeLng.toFixed(6)}`);
  
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
  }
  
  console.log(`buildNavigationURL: Circular route with ${waypoints.length} waypoints, destination 10m from home`);
  
  return url;
}
