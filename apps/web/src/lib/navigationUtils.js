/**
 * Pawtimation - Dog-Walking Loop Generator (Google Maps compatible)
 * Generates realistic 30-60 min walking loops.
 *
 * Fixed version with:
 * - Smaller radius for realistic neighborhood loops
 * - 4 waypoints for stable loop shape
 * - Reduced jitter for predictable paths
 */

const WALK_SPEED_KMH = 4; // realistic dog-walking pace
const EARTH_RADIUS_KM = 6371;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function toDeg(rad) {
  return (rad * 180) / Math.PI;
}

function offsetCoordinate(lat, lng, distanceKm, bearingDeg) {
  const bearing = toRad(bearingDeg);
  const latRad = toRad(lat);
  const lngRad = toRad(lng);
  const angDist = distanceKm / EARTH_RADIUS_KM;

  const newLat = Math.asin(
    Math.sin(latRad) * Math.cos(angDist) +
    Math.cos(latRad) * Math.sin(angDist) * Math.cos(bearing)
  );

  const newLng = lngRad + Math.atan2(
    Math.sin(bearing) * Math.sin(angDist) * Math.cos(latRad),
    Math.cos(angDist) - Math.sin(latRad) * Math.sin(newLat)
  );

  return {
    lat: toDeg(newLat),
    lng: toDeg(newLng)
  };
}

function jitterAngle(baseDeg) {
  return baseDeg + (Math.random() - 0.5) * 10; // +/-5 degrees
}

function jitterDistance(baseKm) {
  return baseKm * (0.9 + Math.random() * 0.2); // 0.9-1.1x
}

function generateLoopRoute(homeLat, homeLng, minutes) {
  // 1. Compute target distance (walkingSpeed x time)
  const targetKm = (minutes / 60) * WALK_SPEED_KMH;

  // 2. Much smaller radius produces realistic loop sizes
  const radiusKm = (targetKm / 2) * 0.35;

  console.log(`generateLoopRoute: ${minutes}min = ${targetKm.toFixed(2)}km target, radius=${(radiusKm * 1000).toFixed(0)}m`);

  // 3. 4 waypoints create a much more stable Google Maps loop
  const baseAngles = [45, 135, 225, 300];
  const waypoints = baseAngles.map(base => {
    const angle = jitterAngle(base);
    const distance = jitterDistance(radiusKm);
    return offsetCoordinate(homeLat, homeLng, distance, angle);
  });

  // 4. Destination: ~30m from home (prevents Google collapsing loop)
  const destination = offsetCoordinate(homeLat, homeLng, 0.03, 315);

  return { origin: { lat: homeLat, lng: homeLng }, destination, waypoints };
}

function buildGoogleMapsWalkingUrl(origin, destination, waypoints) {
  const format = p => `${p.lat.toFixed(6)},${p.lng.toFixed(6)}`;

  return (
    `https://www.google.com/maps/dir/?api=1` +
    `&origin=${encodeURIComponent(format(origin))}` +
    `&destination=${encodeURIComponent(format(destination))}` +
    `&waypoints=${encodeURIComponent(waypoints.map(format).join('|'))}` +
    `&travelmode=walking`
  );
}

export function buildNavigationURL(clientLat, clientLng, _unused, durationMinutes = 30) {
  const homeLat = parseFloat(clientLat);
  const homeLng = parseFloat(clientLng);

  if (isNaN(homeLat) || isNaN(homeLng)) return null;

  try {
    const { origin, destination, waypoints } = generateLoopRoute(
      homeLat,
      homeLng,
      durationMinutes
    );
    return buildGoogleMapsWalkingUrl(origin, destination, waypoints);
  } catch (err) {
    console.error("Route generation error:", err);
    return null;
  }
}
