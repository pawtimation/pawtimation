import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;
const OPENROUTESERVICE_KEY = import.meta.env.VITE_OPENROUTESERVICE_API_KEY;

const pawIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <span style="font-size: 18px;">🐾</span>
  </div>`,
  className: '',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

const homeIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    <span style="font-size: 20px;">🏠</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

function MapEventHandler({ onMapClick, editable }) {
  useMapEvents({
    click: (e) => {
      if (editable && onMapClick) {
        onMapClick(e.latlng);
      }
    }
  });
  return null;
}

function FitBoundsControl({ waypoints, homeLocation }) {
  const map = useMap();
  
  const fitBounds = () => {
    const allPoints = [homeLocation, ...waypoints];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  useEffect(() => {
    if (waypoints.length > 0 || homeLocation) {
      fitBounds();
    }
  }, [waypoints, homeLocation]);

  return null;
}

async function fetchRouteFromOpenRouteService(coordinates) {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  try {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/foot-walking', {
      method: 'POST',
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
        'Authorization': OPENROUTESERVICE_KEY,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: JSON.stringify({
        coordinates: coordinates.map(([lat, lng]) => [lng, lat]),
        elevation: false,
        instructions: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouteService error:', errorData);
      return null;
    }

    const data = await response.json();
    const routeCoords = data.routes?.[0]?.geometry?.coordinates || [];
    const distanceMeters = data.routes?.[0]?.summary?.distance || 0;
    const durationSeconds = data.routes?.[0]?.summary?.duration || 0;

    return {
      coordinates: routeCoords.map(([lng, lat]) => [lat, lng]),
      distanceMeters: Math.round(distanceMeters),
      durationMinutes: Math.round(durationSeconds / 60)
    };
  } catch (error) {
    console.error('Route fetch error:', error);
    return null;
  }
}

export function InteractiveRouteMap({ 
  homeLocation, 
  initialWaypoints = [], 
  editable = false,
  onRouteUpdate,
  className = ''
}) {
  const [waypoints, setWaypoints] = useState(initialWaypoints);
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState({ distanceMeters: 0, durationMinutes: 0 });
  const [loading, setLoading] = useState(false);
  const [addingWaypoint, setAddingWaypoint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const routeFetchTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (routeFetchTimeoutRef.current) {
      clearTimeout(routeFetchTimeoutRef.current);
    }

    if (waypoints.length === 0) {
      setRoutePath([]);
      setRouteStats({ distanceMeters: 0, durationMinutes: 0 });
      return;
    }

    routeFetchTimeoutRef.current = setTimeout(() => {
      updateRoute();
    }, 500);

    return () => {
      if (routeFetchTimeoutRef.current) {
        clearTimeout(routeFetchTimeoutRef.current);
      }
    };
  }, [waypoints, homeLocation]);

  async function updateRoute() {
    if (!homeLocation || waypoints.length === 0) return;

    setLoading(true);
    const fullPath = [homeLocation, ...waypoints, homeLocation];
    const route = await fetchRouteFromOpenRouteService(fullPath);

    if (route) {
      setRoutePath(route.coordinates);
      setRouteStats({
        distanceMeters: route.distanceMeters,
        durationMinutes: route.durationMinutes
      });

      if (onRouteUpdate) {
        onRouteUpdate({
          geojson: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: route.coordinates.map(([lat, lng]) => [lng, lat])
            },
            properties: {
              name: 'Walking Route',
              distance: route.distanceMeters,
              duration: route.durationMinutes
            }
          },
          distanceMeters: route.distanceMeters,
          durationMinutes: route.durationMinutes,
          generatedAt: new Date().toISOString(),
          waypoints: waypoints
        });
      }
    }
    setLoading(false);
  }

  function handleAddWaypoint(latlng) {
    if (!addingWaypoint) return;
    setWaypoints(prev => [...prev, [latlng.lat, latlng.lng]]);
    setAddingWaypoint(false);
  }

  function handleRemoveWaypoint(index) {
    setWaypoints(prev => prev.filter((_, i) => i !== index));
  }

  function handleClearWaypoints() {
    setWaypoints([]);
    setRoutePath([]);
    setRouteStats({ distanceMeters: 0, durationMinutes: 0 });
  }

  function handleUndoLastWaypoint() {
    setWaypoints(prev => prev.slice(0, -1));
  }

  function handleRecenter() {
    if (mapRef.current) {
      const allPoints = [homeLocation, ...waypoints];
      if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }

  function onMarkerDragEnd(index, event) {
    const newLatLng = event.target.getLatLng();
    setWaypoints(prev => {
      const updated = [...prev];
      updated[index] = [newLatLng.lat, newLatLng.lng];
      return updated;
    });
  }

  if (!homeLocation) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <p className="text-slate-600">📍 Client address coordinates required to display map</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={homeLocation}
        zoom={14}
        style={{ height: isMobile ? '400px' : '500px', width: '100%', borderRadius: '12px' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
        />
        
        <FitBoundsControl waypoints={waypoints} homeLocation={homeLocation} />
        <MapEventHandler onMapClick={handleAddWaypoint} editable={editable && addingWaypoint} />

        <Marker position={homeLocation} icon={homeIcon} />

        {waypoints.map((point, index) => (
          <Marker
            key={index}
            position={point}
            icon={pawIcon}
            draggable={editable}
            eventHandlers={{
              dragend: (e) => onMarkerDragEnd(index, e)
            }}
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

      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 z-[1000]">
          <svg className="animate-spin h-4 w-4 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-sm text-slate-700">Updating route...</span>
        </div>
      )}

      {routeStats.distanceMeters > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="bg-teal-50 p-3 rounded-lg">
            <div className="text-teal-600 font-medium text-sm">Distance</div>
            <div className="text-lg font-semibold text-teal-900">
              {(routeStats.distanceMeters / 1000).toFixed(2)} km
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-blue-600 font-medium text-sm">Duration</div>
            <div className="text-lg font-semibold text-blue-900">
              {routeStats.durationMinutes} min
            </div>
          </div>
        </div>
      )}

      {editable && (
        <div className={`mt-4 ${isMobile ? 'fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 z-[1000] rounded-t-2xl shadow-2xl' : 'bg-white border rounded-lg p-4'}`}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAddingWaypoint(!addingWaypoint)}
              className={`px-4 py-3 rounded-lg font-semibold transition-colors ${
                addingWaypoint 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
              style={{ minHeight: '44px' }}
            >
              {addingWaypoint ? '📍 Tap map to add' : '➕ Add Waypoint'}
            </button>
            
            <button
              onClick={handleUndoLastWaypoint}
              disabled={waypoints.length === 0}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ minHeight: '44px' }}
            >
              ↶ Undo
            </button>
            
            <button
              onClick={handleClearWaypoints}
              disabled={waypoints.length === 0}
              className="px-4 py-3 bg-rose-50 text-rose-700 rounded-lg font-semibold hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              style={{ minHeight: '44px' }}
            >
              🗑️ Clear All
            </button>
            
            <button
              onClick={handleRecenter}
              className="px-4 py-3 bg-blue-50 text-blue-700 rounded-lg font-semibold hover:bg-blue-100 transition-colors"
              style={{ minHeight: '44px' }}
            >
              🎯 Re-center
            </button>
          </div>

          {waypoints.length > 0 && (
            <div className="mt-3 text-sm text-slate-600">
              <p className="font-medium">📌 {waypoints.length} waypoint{waypoints.length > 1 ? 's' : ''} added</p>
              <p className="text-xs mt-1">Drag markers to adjust the route</p>
            </div>
          )}

          <button
            disabled
            className="w-full mt-3 px-4 py-3 bg-slate-100 text-slate-500 rounded-lg font-medium text-sm cursor-not-allowed"
            style={{ minHeight: '44px' }}
          >
            📍 Live Location (Coming Soon)
          </button>
        </div>
      )}
    </div>
  );
}
