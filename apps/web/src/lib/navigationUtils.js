/**
 * Navigation URL builder for circular walking routes
 * 
 * Strategy:
 * 1. Start point = client home coordinates
 * 2. Calculate walking distance based on duration (4.5 km/h pace)
 * 3. Generate 2 intermediate waypoints at different bearings (45deg, 135deg)
 * 4. Final destination = 30m from home (NOT identical to start)
 * 5. Build Google Maps URL with origin -> waypoints -> destination
 * 
 * This produces a visual loop that Google Maps can navigate properly.
 */

// Calculate a point at a given distance and bearing from start
function calculateWaypoint(lat, lng, distanceKm, bearingDegrees) {
  const R = 6371; // Earth's radius in km
  const bearing = bearingDegrees * Math.PI / 180;
  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / R) +
    Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
  );
  
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
    Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return {
    lat: lat2 * 180 / Math.PI,
    lng: lng2 * 180 / Math.PI
  };
}

export function buildNavigationURL(clientLat, clientLng, routeCoordinates, durationMinutes = 30) {
  const startLat = parseFloat(clientLat);
  const startLng = parseFloat(clientLng);
  
  if (isNaN(startLat) || isNaN(startLng)) {
    console.error('buildNavigationURL: Invalid client coordinates', { clientLat, clientLng });
    return null;
  }
  
  // Calculate target distance based on duration (4.5 km/h walking pace)
  // 30 min = 2.25 km, 60 min = 4.5 km, 90 min = 6.75 km
  const walkingSpeedKmh = 4.5;
  const totalDistanceKm = (durationMinutes / 60) * walkingSpeedKmh;
  
  // Each leg should be roughly 1/4 of total distance
  const legDistanceKm = totalDistanceKm / 4;
  
  console.log(`buildNavigationURL: ${durationMinutes}min walk = ${totalDistanceKm.toFixed(2)}km, leg=${legDistanceKm.toFixed(2)}km`);
  
  // Generate waypoints at different bearings
  // Waypoint 1: 45 degrees from start, at 1/4 distance
  const waypoint1 = calculateWaypoint(startLat, startLng, legDistanceKm, 45);
  
  // Waypoint 2: 135 degrees from start, at 2/4 distance (farthest point)
  const waypoint2 = calculateWaypoint(startLat, startLng, legDistanceKm * 2, 135);
  
  // Waypoint 3: 225 degrees from start, at 1/4 distance (heading back)
  const waypoint3 = calculateWaypoint(startLat, startLng, legDistanceKm, 225);
  
  // Final destination: 30 meters from home (NOT identical to start)
  // 30 meters = 0.03 km, bearing 315 degrees
  const destination = calculateWaypoint(startLat, startLng, 0.03, 315);
  
  console.log(`Waypoint 1 (45deg): ${waypoint1.lat.toFixed(6)}, ${waypoint1.lng.toFixed(6)}`);
  console.log(`Waypoint 2 (135deg): ${waypoint2.lat.toFixed(6)}, ${waypoint2.lng.toFixed(6)}`);
  console.log(`Waypoint 3 (225deg): ${waypoint3.lat.toFixed(6)}, ${waypoint3.lng.toFixed(6)}`);
  console.log(`Destination (30m from home): ${destination.lat.toFixed(6)}, ${destination.lng.toFixed(6)}`);
  
  // Build waypoints string (Google Maps format: "lat,lng")
  const waypointsStr = [
    `${waypoint1.lat.toFixed(6)},${waypoint1.lng.toFixed(6)}`,
    `${waypoint2.lat.toFixed(6)},${waypoint2.lng.toFixed(6)}`,
    `${waypoint3.lat.toFixed(6)},${waypoint3.lng.toFixed(6)}`
  ].join('|');
  
  // Build URL
  const origin = encodeURIComponent(`${startLat},${startLng}`);
  const dest = encodeURIComponent(`${destination.lat.toFixed(6)},${destination.lng.toFixed(6)}`);
  const waypoints = encodeURIComponent(waypointsStr);
  
  const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&waypoints=${waypoints}&travelmode=walking`;
  
  console.log(`buildNavigationURL: Generated loop route URL`);
  
  return url;
}
