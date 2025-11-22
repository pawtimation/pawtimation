import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/auth';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY;

const pawIcon = (isNew = false, isFading = false) => L.divIcon({
  html: `<div class="${isNew ? 'waypoint-pulse' : ''} ${isFading ? 'waypoint-fade-out' : ''}" style="background: #2BA39B; width: 44px; height: 44px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(43, 163, 155, 0.4); transition: all 0.3s ease;">
    <span style="font-size: 24px;">🐾</span>
  </div>`,
  className: '',
  iconSize: [44, 44],
  iconAnchor: [22, 22]
});

const homeIcon = L.divIcon({
  html: `<div style="background: #2BA39B; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4px solid white; box-shadow: 0 4px 12px rgba(43, 163, 155, 0.5);">
    <span style="font-size: 28px;">🏠</span>
  </div>`,
  className: '',
  iconSize: [48, 48],
  iconAnchor: [24, 24]
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

function ZoomControls() {
  const map = useMap();
  
  return (
    <div className="absolute bottom-24 left-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-lg w-10 h-10 flex items-center justify-center font-bold text-lg transition-all hover:shadow-xl"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-lg w-10 h-10 flex items-center justify-center font-bold text-lg transition-all hover:shadow-xl"
        aria-label="Zoom out"
      >
        −
      </button>
    </div>
  );
}

function RecenterButton({ waypoints, homeLocation }) {
  const map = useMap();
  
  const handleRecenter = () => {
    const waypointCoords = waypoints.map(wp => wp.coords);
    const allPoints = [homeLocation, ...waypointCoords];
    if (allPoints.length > 0) {
      const bounds = L.latLngBounds(allPoints);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  return (
    <button
      onClick={handleRecenter}
      className="absolute bottom-24 right-4 z-[1000] bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-lg px-4 h-10 flex items-center justify-center font-medium text-sm transition-all hover:shadow-xl"
      aria-label="Re-center map"
    >
      <span className="mr-1">🎯</span> Re-center
    </button>
  );
}

function FitBoundsControl({ waypoints, homeLocation }) {
  const map = useMap();
  
  const fitBounds = () => {
    const waypointCoords = waypoints.map(wp => wp.coords);
    const allPoints = [homeLocation, ...waypointCoords];
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

async function fetchRouteFromBackend(coordinates, role) {
  if (!coordinates || coordinates.length < 2) {
    return null;
  }

  try {
    const response = await api('/proxy/route', {
      method: 'POST',
      role: role,
      body: JSON.stringify({
        coordinates: coordinates.map(([lat, lng]) => [lng, lat])
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Route proxy error:', errorData);
      return null;
    }

    const data = await response.json();
    const routeCoords = data.features?.[0]?.geometry?.coordinates || [];
    const distanceMeters = data.features?.[0]?.properties?.summary?.distance || 0;
    const durationSeconds = data.features?.[0]?.properties?.summary?.duration || 0;

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
  role = 'admin',
  className = ''
}) {
  // Convert waypoints to objects with unique IDs for safe removal
  const [waypoints, setWaypoints] = useState(() => 
    initialWaypoints.map((point, idx) => ({ 
      id: `wp-${Date.now()}-${idx}`, 
      coords: point 
    }))
  );
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState({ distanceMeters: 0, durationMinutes: 0 });
  const [loading, setLoading] = useState(false);
  const [addingWaypoint, setAddingWaypoint] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [newWaypointId, setNewWaypointId] = useState(null);
  const [fadingWaypointIds, setFadingWaypointIds] = useState(new Set());
  const [toastQueue, setToastQueue] = useState([]);
  const [currentToast, setCurrentToast] = useState(null);
  const routeFetchTimeoutRef = useRef(null);
  const toastTimeoutRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setWaypoints(initialWaypoints.map((point, idx) => ({ 
      id: `wp-${Date.now()}-${idx}`, 
      coords: point 
    })));
  }, [initialWaypoints]);

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

  // Toast queue management - show next toast when current is cleared
  useEffect(() => {
    if (!currentToast && toastQueue.length > 0) {
      const nextToast = toastQueue[0];
      setCurrentToast(nextToast);
      setToastQueue(prev => prev.slice(1));
    }
  }, [currentToast, toastQueue]);

  // Auto-dismiss current toast after delay
  useEffect(() => {
    if (currentToast) {
      toastTimeoutRef.current = setTimeout(() => {
        setCurrentToast(null);
      }, 2500);

      return () => {
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
      };
    }
  }, [currentToast]);

  async function updateRoute() {
    if (!homeLocation || waypoints.length === 0) return;

    setLoading(true);
    const waypointCoords = waypoints.map(wp => wp.coords);
    const fullPath = [homeLocation, ...waypointCoords, homeLocation];
    const route = await fetchRouteFromBackend(fullPath, role);

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
          waypoints: waypointCoords
        });
      }
    }
    setLoading(false);
  }

  function showNotification(message) {
    setToastQueue(prev => [...prev, message]);
  }

  function handleAddWaypoint(latlng) {
    if (!addingWaypoint) return;
    const newId = `wp-${Date.now()}-${Math.random()}`;
    const newWaypoint = { id: newId, coords: [latlng.lat, latlng.lng] };
    setWaypoints(prev => [...prev, newWaypoint]);
    setNewWaypointId(newId);
    setAddingWaypoint(false);
    showNotification('Waypoint added');
    
    setTimeout(() => setNewWaypointId(null), 600);
  }

  function handleRemoveWaypoint(waypointId) {
    setFadingWaypointIds(prev => new Set([...prev, waypointId]));
    showNotification('Waypoint removed');
    
    setTimeout(() => {
      setWaypoints(prev => prev.filter(wp => wp.id !== waypointId));
      setFadingWaypointIds(prev => {
        const next = new Set(prev);
        next.delete(waypointId);
        return next;
      });
    }, 300);
  }

  function handleClearWaypoints() {
    setWaypoints([]);
    setRoutePath([]);
    setRouteStats({ distanceMeters: 0, durationMinutes: 0 });
    showNotification('Route cleared');
  }

  function handleUndoLastWaypoint() {
    if (waypoints.length > 0) {
      const lastWaypoint = waypoints[waypoints.length - 1];
      setFadingWaypointIds(prev => new Set([...prev, lastWaypoint.id]));
      showNotification('Undone');
      
      setTimeout(() => {
        setWaypoints(prev => prev.slice(0, -1));
        setFadingWaypointIds(prev => {
          const next = new Set(prev);
          next.delete(lastWaypoint.id);
          return next;
        });
      }, 300);
    }
  }

  function onMarkerDragEnd(waypointId, event) {
    const newLatLng = event.target.getLatLng();
    setWaypoints(prev => prev.map(wp => 
      wp.id === waypointId 
        ? { ...wp, coords: [newLatLng.lat, newLatLng.lng] }
        : wp
    ));
  }

  if (!homeLocation) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <p className="text-slate-600">📍 Client address coordinates required to display map</p>
      </div>
    );
  }

  const mapHeight = isMobile ? '65vh' : '500px';
  const startPoint = homeLocation;
  const endPoint = homeLocation; // Route always returns to home

  return (
    <div className={`relative ${className}`}>
      <style>{`
        @keyframes pulse-waypoint {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
        .waypoint-pulse {
          animation: pulse-waypoint 0.6s ease-out;
        }
        @keyframes fade-out-waypoint {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        .waypoint-fade-out {
          animation: fade-out-waypoint 0.3s ease-in forwards;
        }
        .toast-enter {
          animation: toast-slide-in 0.3s ease-out;
        }
        @keyframes toast-slide-in {
          from { transform: translate(-50%, -120%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        .leaflet-control-container .leaflet-top,
        .leaflet-control-container .leaflet-bottom {
          display: none !important;
        }
      `}</style>

      <MapContainer
        center={homeLocation}
        zoom={14}
        style={{ height: mapHeight, width: '100%', borderRadius: '12px' }}
        ref={mapRef}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
          url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
        />
        
        <FitBoundsControl waypoints={waypoints} homeLocation={homeLocation} />
        <MapEventHandler onMapClick={handleAddWaypoint} editable={editable && addingWaypoint} />
        <ZoomControls />
        <RecenterButton waypoints={waypoints} homeLocation={homeLocation} />

        <Marker position={homeLocation} icon={homeIcon} />

        {waypoints.map((waypoint) => (
          <Marker
            key={waypoint.id}
            position={waypoint.coords}
            icon={pawIcon(waypoint.id === newWaypointId, fadingWaypointIds.has(waypoint.id))}
            draggable={editable && !fadingWaypointIds.has(waypoint.id)}
            eventHandlers={{
              dragend: (e) => onMarkerDragEnd(waypoint.id, e),
              click: editable ? () => handleRemoveWaypoint(waypoint.id) : undefined
            }}
          />
        ))}

        {routePath.length > 0 && (
          <>
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#2BA39B',
                weight: 10,
                opacity: 0.2,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
            <Polyline
              positions={routePath}
              pathOptions={{
                color: '#2BA39B',
                weight: 6,
                opacity: 0.85,
                lineJoin: 'round',
                lineCap: 'round'
              }}
            />
          </>
        )}
      </MapContainer>

      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 z-[1000]">
          <svg className="animate-spin h-4 w-4 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-sm text-slate-700">Calculating route...</span>
        </div>
      )}

      {currentToast && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-teal-600 text-white rounded-lg shadow-xl px-4 py-2 z-[1000] toast-enter">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium">{currentToast}</span>
          </div>
        </div>
      )}

      {routeStats.distanceMeters > 0 && (
        <div className="mt-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-100">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <span>📊</span> Route Preview
          </h4>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-teal-600 font-medium text-xs mb-1">Distance</div>
              <div className="text-xl font-bold text-teal-900">
                {(routeStats.distanceMeters / 1000).toFixed(2)} km
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {routeStats.distanceMeters} meters
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-blue-600 font-medium text-xs mb-1">Duration</div>
              <div className="text-xl font-bold text-blue-900">
                {routeStats.durationMinutes} min
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Estimated walk time
              </div>
            </div>
          </div>
          <div className="bg-white p-3 rounded-lg shadow-sm space-y-2">
            <div className="flex items-center text-xs">
              <span className="font-medium text-slate-600 min-w-[50px]">Start:</span>
              <span className="text-slate-800 flex items-center gap-1">
                <span>🏠</span>
                <span>Client Address</span>
                <span className="text-slate-400 ml-1">({startPoint[0].toFixed(5)}, {startPoint[1].toFixed(5)})</span>
              </span>
            </div>
            <div className="flex items-center text-xs">
              <span className="font-medium text-slate-600 min-w-[50px]">End:</span>
              <span className="text-slate-800 flex items-center gap-1">
                <span>🏠</span>
                <span>Returns to Start</span>
                <span className="text-slate-400 ml-1">({endPoint[0].toFixed(5)}, {endPoint[1].toFixed(5)})</span>
              </span>
            </div>
            {waypoints.length > 0 && (
              <div className="pt-2 border-t border-slate-100">
                <span className="font-medium text-slate-600 text-xs">{waypoints.length}</span>
                <span className="text-xs text-slate-600"> waypoint{waypoints.length > 1 ? 's' : ''} along the route</span>
              </div>
            )}
          </div>
        </div>
      )}

      {editable && (
        <div className={`mt-4 ${isMobile ? 'fixed bottom-0 left-0 right-0 bg-white border-t-2 border-slate-200 p-4 z-[1000] rounded-t-2xl shadow-2xl' : 'bg-white border rounded-xl p-4 shadow-sm'}`}>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setAddingWaypoint(!addingWaypoint)}
              className={`px-4 py-3 rounded-xl font-semibold transition-all shadow-sm ${
                addingWaypoint 
                  ? 'bg-teal-600 text-white shadow-md' 
                  : 'bg-teal-50 text-teal-700 hover:bg-teal-100'
              }`}
              style={{ minHeight: '48px' }}
            >
              {addingWaypoint ? '📍 Tap map to add' : '➕ Add Waypoint'}
            </button>
            
            <button
              onClick={handleUndoLastWaypoint}
              disabled={waypoints.length === 0}
              className="px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              style={{ minHeight: '48px' }}
            >
              ↶ Undo
            </button>
            
            <button
              onClick={handleClearWaypoints}
              disabled={waypoints.length === 0}
              className="px-4 py-3 bg-rose-50 text-rose-700 rounded-xl font-semibold hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              style={{ minHeight: '48px' }}
            >
              🗑️ Clear Route
            </button>
            
            <button
              onClick={() => {
                const waypointCoords = waypoints.map(wp => wp.coords);
                const allPoints = [homeLocation, ...waypointCoords];
                if (allPoints.length > 0 && mapRef.current) {
                  const bounds = L.latLngBounds(allPoints);
                  mapRef.current.fitBounds(bounds, { padding: [50, 50] });
                }
              }}
              className="px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-semibold hover:bg-blue-100 transition-all shadow-sm"
              style={{ minHeight: '48px' }}
            >
              🎯 Re-center
            </button>
          </div>

          {waypoints.length > 0 && (
            <div className="mt-3 p-3 bg-slate-50 rounded-lg">
              <p className="font-medium text-sm text-slate-700 flex items-center gap-2">
                <span className="text-teal-600">📌</span>
                {waypoints.length} waypoint{waypoints.length > 1 ? 's' : ''} added
              </p>
              <p className="text-xs mt-1 text-slate-600">Drag markers to adjust • Tap markers to remove</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
