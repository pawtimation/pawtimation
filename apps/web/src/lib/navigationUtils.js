/**
 * Centralized navigation URL builder for walking routes
 * De-duplicates origin/destination points, trims to Google's waypoint limit,
 * and properly encodes all segments
 */
export function buildNavigationURL(clientLat, clientLng, routeCoordinates) {
  if (!clientLat || !clientLng) {
    console.error('buildNavigationURL: Client coordinates are required');
    return null;
  }

  const coords = routeCoordinates || [];
  
  // Filter waypoints to remove duplicates and origin/destination
  const waypoints = coords
    .filter(([lng, lat]) => {
      // Remove waypoints that match client location (within small tolerance)
      const latDiff = Math.abs(lat - clientLat);
      const lngDiff = Math.abs(lng - clientLng);
      return latDiff > 0.0001 || lngDiff > 0.0001;
    })
    .map(([lng, lat]) => `${lat},${lng}`);
  
  // Limit to 23 waypoints (Google Maps API limit is 25 total including origin/destination)
  const limitedWaypoints = waypoints.slice(0, 23);
  const waypointStr = limitedWaypoints.join('|');
  
  // Build URL with client location as start/end and filtered route waypoints
  const origin = encodeURIComponent(`${clientLat},${clientLng}`);
  const destination = encodeURIComponent(`${clientLat},${clientLng}`);
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  
  if (waypointStr) {
    url += `&waypoints=${encodeURIComponent(waypointStr)}`;
  }
  
  return url;
}
