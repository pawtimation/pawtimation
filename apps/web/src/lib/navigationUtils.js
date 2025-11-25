/**
 * Centralized navigation URL builder for walking routes
 * De-duplicates origin/destination points, samples intelligently for long routes,
 * trims to Google's waypoint limit, and properly encodes all segments
 */
export function buildNavigationURL(clientLat, clientLng, routeCoordinates) {
  // Ensure coordinates are numbers
  const startLat = parseFloat(clientLat);
  const startLng = parseFloat(clientLng);
  
  if (isNaN(startLat) || isNaN(startLng)) {
    console.error('buildNavigationURL: Invalid client coordinates', { clientLat, clientLng });
    return null;
  }

  const coords = routeCoordinates || [];
  
  if (!Array.isArray(coords) || coords.length === 0) {
    console.warn('buildNavigationURL: No route coordinates provided');
    // Return basic navigation to client location
    const origin = encodeURIComponent(`${startLat},${startLng}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${origin}&travelmode=walking`;
  }
  
  // Filter waypoints to remove duplicates near origin/destination
  const filteredCoords = coords.filter(coord => {
    if (!Array.isArray(coord) || coord.length < 2) return false;
    const lng = parseFloat(coord[0]);
    const lat = parseFloat(coord[1]);
    if (isNaN(lat) || isNaN(lng)) return false;
    
    // Remove waypoints within ~11m of client location (0.0001 degrees)
    const latDiff = Math.abs(lat - startLat);
    const lngDiff = Math.abs(lng - startLng);
    return latDiff > 0.0001 || lngDiff > 0.0001;
  });
  
  if (filteredCoords.length === 0) {
    console.warn('buildNavigationURL: All coordinates filtered out');
    const origin = encodeURIComponent(`${startLat},${startLng}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${origin}&travelmode=walking`;
  }
  
  // Google Maps allows max 25 total points (origin + destination + 23 waypoints)
  // For long routes, sample evenly to get key waypoints
  const maxWaypoints = 23;
  let sampledCoords = filteredCoords;
  
  if (filteredCoords.length > maxWaypoints) {
    // Sample evenly distributed waypoints
    const step = filteredCoords.length / maxWaypoints;
    sampledCoords = [];
    for (let i = 0; i < maxWaypoints; i++) {
      const idx = Math.min(Math.floor(i * step), filteredCoords.length - 1);
      sampledCoords.push(filteredCoords[idx]);
    }
  }
  
  // Convert to Google Maps format (lat,lng)
  const waypoints = sampledCoords.map(coord => {
    const lng = parseFloat(coord[0]);
    const lat = parseFloat(coord[1]);
    return `${lat.toFixed(6)},${lng.toFixed(6)}`;
  });
  
  const waypointStr = waypoints.join('|');
  
  // Build URL with client location as start/end and sampled route waypoints
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const destination = encodeURIComponent(`${startLat},${startLng}`);
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  if (waypointStr) {
    url += `&waypoints=${encodeURIComponent(waypointStr)}`;
  }
  
  console.log(`buildNavigationURL: ${filteredCoords.length} coords -> ${waypoints.length} waypoints`);
  
  return url;
}
