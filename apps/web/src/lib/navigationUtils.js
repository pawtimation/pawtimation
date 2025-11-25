/**
 * Centralized navigation URL builder for circular walking routes
 * Creates a proper loop by setting the farthest waypoint as destination
 * and including the return-to-home as a via-waypoint
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
    const dest = encodeURIComponent(`${startLat},${startLng}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
  }
  
  // Parse and validate all coordinates
  const validCoords = coords
    .filter(coord => Array.isArray(coord) && coord.length >= 2)
    .map(coord => ({
      lng: parseFloat(coord[0]),
      lat: parseFloat(coord[1])
    }))
    .filter(c => !isNaN(c.lat) && !isNaN(c.lng));
  
  if (validCoords.length === 0) {
    console.warn('buildNavigationURL: No valid coordinates');
    const dest = encodeURIComponent(`${startLat},${startLng}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=walking`;
  }
  
  // Find the farthest point from start to use as destination
  // This prevents Google Maps from collapsing origin=destination routes
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
  
  // Build the route: origin -> waypoints before farthest -> farthest (destination) -> waypoints after -> return home
  const beforeFarthest = validCoords.slice(0, farthestIdx);
  const farthestPoint = validCoords[farthestIdx];
  const afterFarthest = validCoords.slice(farthestIdx + 1);
  
  // Combine waypoints: before destination + after destination + return to home
  let allWaypoints = [
    ...beforeFarthest.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`),
    ...afterFarthest.map(c => `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`),
    `${startLat.toFixed(6)},${startLng.toFixed(6)}` // Return to home
  ];
  
  // Google Maps allows max 25 total points (origin + destination + 23 waypoints)
  // Sample if needed
  const maxWaypoints = 23;
  if (allWaypoints.length > maxWaypoints) {
    const step = allWaypoints.length / maxWaypoints;
    const sampled = [];
    for (let i = 0; i < maxWaypoints - 1; i++) {
      const idx = Math.min(Math.floor(i * step), allWaypoints.length - 1);
      sampled.push(allWaypoints[idx]);
    }
    // Always include the return-to-home as last waypoint
    sampled.push(`${startLat.toFixed(6)},${startLng.toFixed(6)}`);
    allWaypoints = sampled;
  }
  
  // Build URL
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const destination = encodeURIComponent(`${farthestPoint.lat.toFixed(6)},${farthestPoint.lng.toFixed(6)}`);
  
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  if (allWaypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(allWaypoints.join('|'))}`;
  }
  
  console.log(`buildNavigationURL: ${validCoords.length} coords, farthest at idx ${farthestIdx}, ${allWaypoints.length} waypoints (including return home)`);
  
  return url;
}
