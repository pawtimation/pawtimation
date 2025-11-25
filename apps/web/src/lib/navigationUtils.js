/**
 * Navigation URL builder for circular walking routes
 * 
 * Strategy: Set destination to a point ~10m from home (not exactly home).
 * This tricks Google Maps into showing the full circular route with 
 * turn-by-turn navigation. Key waypoints are sampled from the route.
 * 
 * IMPORTANT: GeoJSON uses [longitude, latitude] format!
 * Google Maps expects "latitude,longitude" in URLs.
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
  
  // Parse GeoJSON coordinates: [lng, lat] format
  const validCoords = coords
    .filter(coord => Array.isArray(coord) && coord.length >= 2)
    .map(coord => {
      // GeoJSON is [longitude, latitude] - index 0 is lng, index 1 is lat
      const lng = parseFloat(coord[0]);
      const lat = parseFloat(coord[1]);
      return { lat, lng };
    })
    .filter(c => !isNaN(c.lat) && !isNaN(c.lng));
  
  if (validCoords.length === 0) {
    console.warn('buildNavigationURL: No valid coordinates found');
    return null;
  }
  
  console.log(`buildNavigationURL: Processing ${validCoords.length} coordinates`);
  console.log(`First coord: lat=${validCoords[0].lat}, lng=${validCoords[0].lng}`);
  
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
  console.log(`Farthest point at idx ${farthestIdx}: lat=${farthestPoint.lat}, lng=${farthestPoint.lng}`);
  
  // Create destination ~10m from home (offset by ~0.0001 degrees)
  // This prevents Google Maps from collapsing origin=destination
  const nearHomeLat = startLat + 0.0001;
  const nearHomeLng = startLng + 0.0001;
  
  // Sample waypoints at key positions along the route
  // Google Maps allows max 23 waypoints, we use 8 for a clean route
  const maxWaypoints = 8;
  let waypoints = [];
  
  // Always include: start area, 1/4 point, halfway/turnaround, 3/4 point
  const keyIndices = [
    0,
    Math.floor(validCoords.length * 0.25),
    farthestIdx, // Turnaround point
    Math.floor(validCoords.length * 0.75),
  ];
  
  // Add more points if we have room
  if (validCoords.length > 20) {
    keyIndices.push(
      Math.floor(validCoords.length * 0.125),
      Math.floor(validCoords.length * 0.375),
      Math.floor(validCoords.length * 0.625),
      Math.floor(validCoords.length * 0.875)
    );
  }
  
  // Sort and deduplicate indices
  const uniqueIndices = [...new Set(keyIndices)].sort((a, b) => a - b);
  
  // Build waypoints list (Google Maps format: "lat,lng")
  uniqueIndices.forEach(idx => {
    if (idx >= 0 && idx < validCoords.length) {
      const c = validCoords[idx];
      const waypointStr = `${c.lat.toFixed(6)},${c.lng.toFixed(6)}`;
      if (!waypoints.includes(waypointStr)) {
        waypoints.push(waypointStr);
      }
    }
  });
  
  // Build URL: origin (home) -> waypoints -> destination (near home)
  // Google Maps format: "lat,lng" (opposite of GeoJSON!)
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const destination = encodeURIComponent(`${nearHomeLat.toFixed(6)},${nearHomeLng.toFixed(6)}`);
  
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  if (waypoints.length > 0) {
    url += `&waypoints=${encodeURIComponent(waypoints.join('|'))}`;
  }
  
  console.log(`buildNavigationURL: Circular route with ${waypoints.length} waypoints`);
  console.log(`Waypoints: ${waypoints.join(' -> ')}`);
  
  return url;
}
