/**
 * Walking Route Generator
 * Generates circular walking routes based on duration and start coordinates
 */

/**
 * Generate a circular walking route
 * @param {number} lat - Starting latitude
 * @param {number} lng - Starting longitude
 * @param {number} durationMinutes - Service duration (30, 60, or 90)
 * @returns {Object} Route data with geojson, distance, duration
 */
export function generateCircularRoute(lat, lng, durationMinutes) {
  // Target distance based on duration (assuming average walking speed ~4km/h with dog)
  const distanceTargetKm = {
    30: 2,
    60: 4,
    90: 6.5
  }[durationMinutes] || 2;

  const distanceMeters = distanceTargetKm * 1000;
  
  // Calculate radius for circular route (circumference / 2π)
  const radiusMeters = distanceMeters / (2 * Math.PI);
  
  // Generate waypoints for a circular route (8 points around the circle)
  const numWaypoints = 8;
  const waypoints = [];
  
  for (let i = 0; i < numWaypoints; i++) {
    const angle = (i / numWaypoints) * 2 * Math.PI;
    const point = calculateOffset(lat, lng, radiusMeters, angle);
    waypoints.push(point);
  }
  
  // Close the loop by returning to start
  waypoints.push([lng, lat]);
  
  // Create GeoJSON
  const geojson = {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: waypoints
    },
    properties: {
      name: 'Walking Route',
      distance: distanceMeters,
      duration: durationMinutes
    }
  };
  
  return {
    geojson,
    distanceMeters: Math.round(distanceMeters),
    durationMinutes,
    generatedAt: new Date().toISOString()
  };
}

/**
 * Calculate a point offset from origin by distance and bearing
 * @param {number} lat - Origin latitude
 * @param {number} lng - Origin longitude
 * @param {number} distanceMeters - Distance to offset
 * @param {number} bearing - Bearing in radians
 * @returns {Array} [lng, lat] coordinates
 */
function calculateOffset(lat, lng, distanceMeters, bearing) {
  const R = 6378137; // Earth's radius in meters
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  
  const angularDistance = distanceMeters / R;
  
  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(angularDistance) +
    Math.cos(latRad) * Math.sin(angularDistance) * Math.cos(bearing)
  );
  
  const newLngRad = lngRad + Math.atan2(
    Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRad),
    Math.cos(angularDistance) - Math.sin(latRad) * Math.sin(newLatRad)
  );
  
  const newLat = (newLatRad * 180) / Math.PI;
  const newLng = (newLngRad * 180) / Math.PI;
  
  return [newLng, newLat];
}

/**
 * Encode polyline for navigation apps (simplified version)
 * @param {Array} coordinates - Array of [lng, lat] coordinates
 * @returns {string} Encoded polyline
 */
export function encodePolyline(coordinates) {
  // For simplicity, return coordinates as URL-safe string
  // Real apps can use @mapbox/polyline package for proper encoding
  const points = coordinates.map(([lng, lat]) => `${lat.toFixed(6)},${lng.toFixed(6)}`);
  return points.join('|');
}

/**
 * Generate navigation URL for external maps apps
 * @param {Object} route - Route object with geojson
 * @param {string} platform - 'apple' or 'google'
 * @returns {string} Navigation URL
 */
export function generateNavigationUrl(route, platform = 'google') {
  const coords = route.geojson.geometry.coordinates;
  const start = coords[0];
  const waypoints = coords.slice(1, -1);
  
  if (platform === 'apple') {
    // Apple Maps URL scheme
    const waypointParams = waypoints
      .map(([lng, lat]) => `&daddr=${lat},${lng}`)
      .join('');
    return `maps://?saddr=${start[1]},${start[0]}${waypointParams}`;
  } else {
    // Google Maps URL
    const waypointStr = waypoints
      .map(([lng, lat]) => `${lat},${lng}`)
      .join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${start[1]},${start[0]}&destination=${start[1]},${start[0]}&waypoints=${waypointStr}&travelmode=walking`;
  }
}

/**
 * Generate static map image URL
 * @param {Object} route - Route object with geojson
 * @param {number} width - Map width in pixels
 * @param {number} height - Map height in pixels
 * @returns {string} Static map URL
 */
export function generateStaticMapUrl(route, width = 600, height = 400) {
  const coords = route.geojson.geometry.coordinates;
  const center = coords[0];
  
  // Using OpenStreetMap static map service (free, no API key)
  const zoom = 14;
  const markers = coords.map(([lng, lat]) => `${lat},${lng}`).join('|');
  
  // Alternative: Use Mapbox static API if API key is available
  // For now, return a basic OSM tile URL
  return `https://www.openstreetmap.org/export/embed.html?bbox=${coords.map(c => c.join(',')).join(',')}&layer=mapnik&marker=${center[1]},${center[0]}`;
}
