import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { isMapsEnabled } from '../lib/mapsEnabled';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const homeIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const pawIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 10c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-2 6c0 1.1.9 2 2 2s2-.9 2-2-.9-2-2-2-2 .9-2 2zm-4-4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm8 0c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/></svg>
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

  if (!isMapsEnabled()) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <div className="flex flex-col items-center justify-center gap-2 text-slate-600">
          <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <span className="text-sm">Maps are currently disabled</span>
        </div>
      </div>
    );
  }

  if (!route && !homeLocation) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <p className="text-slate-600">No route available</p>
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
