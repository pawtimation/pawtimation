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
  // Walking speed assumptions:
  // - Average walking speed with dog: ~1.2 m/s (~4.3 km/h)
  // - Duration adjustment: 0.50 (calculate route as 50% of selected duration)
  //   e.g., 60 min session = 30 min route, 30 min = 15 min, 90 min = 45 min
  // - Compensation factor: 0.45 to account for street routing detours
  //   (real streets add ~2.2x distance vs perfect circle)
  const walkingSpeedMps = 1.2; // meters per second
  const durationAdjustment = 0.50; // reduce selected duration by 50% for route calculation
  const compensationFactor = 0.45; // reduces ideal distance to account for street detours
  
  // Apply duration adjustment (e.g., 60 min becomes 48 min)
  const adjustedDuration = durationMinutes * durationAdjustment;
  
  // Calculate target distance accounting for real street routing
  const targetMeters = walkingSpeedMps * adjustedDuration * 60 * compensationFactor;
  const distanceMeters = Math.round(targetMeters);
  
  // Calculate radius for circular route (circumference / 2π)
  const radiusMeters = Math.min(distanceMeters / (2 * Math.PI), 400); // clamp radius to 400m max
  
  // Generate waypoints for a circular route (5 points for smoother routing)
  const numWaypoints = 5;
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

/**
 * Generate GPX (GPS Exchange Format) file content for a route
 * @param {Object} route - Route object with geojson
 * @param {string} routeName - Name for the route
 * @returns {string} GPX XML content
 */
export function generateGPX(route, routeName = 'Walking Route') {
  const coords = route.geojson.geometry.coordinates;
  const timestamp = new Date().toISOString();
  
  // Build track points XML
  const trackPoints = coords.map(([lng, lat]) => 
    `      <trkpt lat="${lat.toFixed(6)}" lon="${lng.toFixed(6)}"></trkpt>`
  ).join('\n');
  
  // Build GPX XML
  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Pawtimation CRM" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${routeName}</name>
    <desc>Dog walking route (${(route.distanceMeters / 1000).toFixed(2)} km, ${route.durationMinutes} min)</desc>
    <time>${timestamp}</time>
  </metadata>
  <trk>
    <name>${routeName}</name>
    <type>walking</type>
    <trkseg>
${trackPoints}
    </trkseg>
  </trk>
</gpx>`;
  
  return gpx;
}
