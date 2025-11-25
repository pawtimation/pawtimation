/**
 * Simplified navigation URL builder for walking routes
 * 
 * Strategy: Navigate from home to the turnaround point (farthest from home).
 * Staff gets full turn-by-turn navigation for the outbound leg, then walks 
 * back the same way. This works reliably with free Google Maps.
 * 
 * The in-app map still shows the full circular route for reference.
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
  let farthestPoint = validCoords[0];
  let maxDistance = 0;
  
  validCoords.forEach((coord) => {
    const dist = Math.sqrt(
      Math.pow(coord.lat - startLat, 2) + 
      Math.pow(coord.lng - startLng, 2)
    );
    if (dist > maxDistance) {
      maxDistance = dist;
      farthestPoint = coord;
    }
  });
  
  // Simple point-to-point navigation: home -> turnaround point
  // Staff walks there with navigation, then walks back on their own
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const destination = encodeURIComponent(`${farthestPoint.lat.toFixed(6)},${farthestPoint.lng.toFixed(6)}`);
  
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  console.log(`buildNavigationURL: Turnaround point navigation - distance: ${(maxDistance * 111000).toFixed(0)}m from home`);
  
  return url;
}
