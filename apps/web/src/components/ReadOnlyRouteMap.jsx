import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const homeIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <span style="font-size: 20px;">🏠</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const pawIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <span style="font-size: 18px;">🐾</span>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

function FitBoundsControl({ waypoints, homeLocation, routePath }) {
  const map = useMap();
  
  useEffect(() => {
    const allPoints = routePath.length > 0 ? routePath : [homeLocation, ...waypoints];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [waypoints, homeLocation, routePath]);

  return null;
}

export function ReadOnlyRouteMap({ 
  route, 
  homeLocation,
  className = '',
  height = '400px'
}) {
  const mapRef = useRef(null);

  if (!route && !homeLocation) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <p className="text-slate-600">📍 No route available</p>
      </div>
    );
  }

  const routeCoords = route?.geojson?.geometry?.coordinates || [];
  const routePath = routeCoords.map(([lng, lat]) => [lat, lng]);
  const waypoints = route?.waypoints || [];
  const center = homeLocation || (routePath.length > 0 ? routePath[0] : [51.505, -0.09]);

  const distanceKm = route?.distanceMeters ? (route.distanceMeters / 1000).toFixed(2) : '0.00';
  const durationMin = route?.durationMinutes || 0;

  return (
    <div className={`${className}`}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ height, width: '100%', borderRadius: '12px' }}
        ref={mapRef}
        scrollWheelZoom={false}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
        />
        
        <FitBoundsControl 
          waypoints={waypoints} 
          homeLocation={homeLocation} 
          routePath={routePath}
        />

        {homeLocation && <Marker position={homeLocation} icon={homeIcon} />}

        {waypoints.map((point, index) => (
          <Marker
            key={index}
            position={point}
            icon={pawIcon}
          />
        ))}

        {routePath.length > 0 && (
          <Polyline
            positions={routePath}
            color="#2BA39B"
            weight={4}
            opacity={0.8}
          />
        )}
      </MapContainer>

      {route && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-teal-50 p-3 rounded-lg">
            <div className="text-teal-600 font-medium text-sm">Distance</div>
            <div className="text-lg font-semibold text-teal-900">{distanceKm} km</div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 font-medium text-sm">Duration</div>
            <div className="text-lg font-semibold text-blue-900">{durationMin} min</div>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-slate-500 border-t pt-2">
        <p>Circular walking route starting and ending at the home address</p>
      </div>
    </div>
  );
}
