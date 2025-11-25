import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { staffApi, adminApi } from '../lib/auth';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || 'jweKYfCOpu1RB0Ll9pY8';

const mapStyle = {
  version: 8,
  sources: {
    'osm': {
      type: 'raster',
      tiles: [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: 'OpenStreetMap'
    }
  },
  layers: [
    {
      id: 'osm-tiles',
      type: 'raster',
      source: 'osm',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

export function MapLibreRouteMap({
  homeLocation,
  initialWaypoints = [],
  routeData = null,
  durationMinutes = 30,
  editable = false,
  onRouteUpdate,
  role = 'staff',
  className = ''
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const homeMarkerRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [routeStats, setRouteStats] = useState({ distanceMeters: 0, durationMinutes: 0 });
  const [waypoints, setWaypoints] = useState(initialWaypoints);
  const [generatingRoute, setGeneratingRoute] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !homeLocation) return;
    if (map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [homeLocation[1], homeLocation[0]],
      zoom: 14,
      attributionControl: false
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.current.on('load', () => {
      addHomeMarker();
      
      const geojson = normalizeRouteData(routeData);
      if (geojson) {
        displayRoute(geojson);
        const distance = routeData?.distanceMeters || routeData?.geojson?.properties?.distance || 0;
        const duration = routeData?.durationMinutes || routeData?.geojson?.properties?.duration || Math.round(distance / 80);
        if (distance > 0) {
          setRouteStats({ distanceMeters: distance, durationMinutes: duration });
        }
      }
      
      if (initialWaypoints.length > 0) {
        initialWaypoints.forEach(wp => addWaypointMarker(wp));
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [homeLocation]);

  useEffect(() => {
    if (map.current && map.current.loaded()) {
      const geojson = normalizeRouteData(routeData);
      if (geojson) {
        displayRoute(geojson);
        const distance = routeData?.distanceMeters || routeData?.geojson?.properties?.distance || 0;
        const duration = routeData?.durationMinutes || routeData?.geojson?.properties?.duration || Math.round(distance / 80);
        if (distance > 0) {
          setRouteStats({ distanceMeters: distance, durationMinutes: duration });
        }
      }
    }
  }, [routeData]);

  function normalizeRouteData(data) {
    if (!data) return null;
    
    if (data.geojson?.geometry?.coordinates) {
      return data.geojson;
    }
    
    if (data.geometry?.coordinates) {
      return data;
    }
    
    if (data.coordinates && Array.isArray(data.coordinates)) {
      return {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: data.coordinates
        },
        properties: data.properties || {}
      };
    }
    
    if (data.waypoints && Array.isArray(data.waypoints)) {
      const coords = data.waypoints.map(wp => {
        if (Array.isArray(wp)) {
          return wp.length === 2 ? [wp[1], wp[0]] : wp;
        }
        return [wp.lng, wp.lat];
      });
      if (coords.length > 0) {
        return {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: coords
          },
          properties: {}
        };
      }
    }
    
    return null;
  }

  function addHomeMarker() {
    if (!map.current || !homeLocation) return;
    
    if (homeMarkerRef.current) {
      homeMarkerRef.current.remove();
    }

    const el = document.createElement('div');
    el.className = 'home-marker';
    el.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #2BA39B 0%, #1a7a73 100%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 4px solid white;
        box-shadow: 0 4px 12px rgba(43, 163, 155, 0.5);
      ">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
    `;

    homeMarkerRef.current = new maplibregl.Marker({ element: el })
      .setLngLat([homeLocation[1], homeLocation[0]])
      .addTo(map.current);
  }

  function addWaypointMarker(coords, index) {
    if (!map.current) return;

    const el = document.createElement('div');
    el.className = 'waypoint-marker';
    el.innerHTML = `
      <div style="
        background: #2BA39B;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 3px solid white;
        box-shadow: 0 3px 8px rgba(43, 163, 155, 0.4);
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${index !== undefined ? index + 1 : markersRef.current.length + 1}
      </div>
    `;

    const marker = new maplibregl.Marker({ element: el, draggable: editable })
      .setLngLat([coords[1], coords[0]])
      .addTo(map.current);

    markersRef.current.push(marker);
    return marker;
  }

  function displayRoute(geojson) {
    if (!map.current || !geojson?.geometry?.coordinates) return;

    try {
      if (map.current.getLayer('route-line')) {
        map.current.removeLayer('route-line');
      }
      if (map.current.getLayer('route-outline')) {
        map.current.removeLayer('route-outline');
      }
      if (map.current.getSource('route')) {
        map.current.removeSource('route');
      }
    } catch (e) {
      console.warn('Error removing existing route layers:', e);
    }

    try {
      map.current.addSource('route', {
        type: 'geojson',
        data: geojson
      });

      map.current.addLayer({
        id: 'route-outline',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2BA39B',
          'line-width': 10,
          'line-opacity': 0.25
        }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2BA39B',
          'line-width': 5,
          'line-opacity': 0.9
        }
      });

      const coordinates = geojson.geometry.coordinates;
      if (coordinates.length > 0) {
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
        }, new maplibregl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current.fitBounds(bounds, {
          padding: 60,
          maxZoom: 16
        });
      }
    } catch (e) {
      console.error('Error displaying route:', e);
    }
  }

  async function generateCircularRoute() {
    if (!homeLocation) return;

    setGeneratingRoute(true);
    setLoading(true);

    try {
      const roleApi = role === 'staff' ? staffApi : adminApi;
      
      // Apply 70% duration adjustment to make routes smaller
      const adjustedDuration = durationMinutes * 0.70;
      const targetDistanceKm = (adjustedDuration / 60) * 4.5;
      const targetDistanceMeters = Math.round(targetDistanceKm * 1000);

      const response = await roleApi('/routes/generate-circular', {
        method: 'POST',
        body: JSON.stringify({
          startLat: homeLocation[0],
          startLng: homeLocation[1],
          targetDurationMinutes: durationMinutes,
          targetDistanceMeters: targetDistanceMeters
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Route generation error:', errorData);
        
        generateFallbackRoute();
        return;
      }

      const data = await response.json();
      
      if (data.geojson) {
        displayRoute(data.geojson);
        setRouteStats({
          distanceMeters: data.distanceMeters || targetDistanceMeters,
          durationMinutes: data.durationMinutes || durationMinutes
        });

        if (onRouteUpdate) {
          onRouteUpdate(data);
        }
      }
    } catch (error) {
      console.error('Route generation failed:', error);
      generateFallbackRoute();
    } finally {
      setGeneratingRoute(false);
      setLoading(false);
    }
  }

  function generateFallbackRoute() {
    if (!homeLocation) return;

    // Apply 70% duration adjustment to make routes smaller
    const adjustedDuration = durationMinutes * 0.70;
    const targetDistanceKm = (adjustedDuration / 60) * 4.5;
    const radiusKm = targetDistanceKm / (2 * Math.PI) * 1.2;
    
    const radiusDegrees = radiusKm / 111;
    const center = homeLocation;
    const numPoints = 32;
    const coordinates = [];

    for (let i = 0; i <= numPoints; i++) {
      const angle = (i / numPoints) * 2 * Math.PI;
      const lat = center[0] + radiusDegrees * Math.cos(angle);
      const lng = center[1] + radiusDegrees * Math.sin(angle) / Math.cos(center[0] * Math.PI / 180);
      coordinates.push([lng, lat]);
    }

    const geojson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      },
      properties: {
        name: 'Walking Route',
        distance: Math.round(targetDistanceKm * 1000),
        duration: durationMinutes
      }
    };

    displayRoute(geojson);
    setRouteStats({
      distanceMeters: Math.round(targetDistanceKm * 1000),
      durationMinutes: durationMinutes
    });

    if (onRouteUpdate) {
      onRouteUpdate({
        geojson,
        distanceMeters: Math.round(targetDistanceKm * 1000),
        durationMinutes: durationMinutes,
        generatedAt: new Date().toISOString(),
        isFallback: true
      });
    }
  }

  function handleRecenter() {
    if (!map.current || !homeLocation) return;
    map.current.flyTo({
      center: [homeLocation[1], homeLocation[0]],
      zoom: 14,
      duration: 1000
    });
  }

  if (!homeLocation) {
    return (
      <div className={`bg-slate-100 rounded-xl p-6 text-center ${className}`}>
        <div className="flex items-center justify-center gap-2 text-slate-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>Client address coordinates required to display map</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapContainer} 
        className="w-full rounded-xl overflow-hidden"
        style={{ height: '400px' }}
      />

      {loading && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 flex items-center gap-2 z-10">
          <svg className="animate-spin h-4 w-4 text-teal-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
          </svg>
          <span className="text-sm text-slate-700">
            {generatingRoute ? 'Generating route...' : 'Loading map...'}
          </span>
        </div>
      )}

      <div className="absolute bottom-24 left-4 z-10 flex flex-col gap-2">
        <button
          onClick={handleRecenter}
          className="bg-white hover:bg-slate-50 text-slate-700 rounded-lg shadow-lg w-10 h-10 flex items-center justify-center transition-all hover:shadow-xl"
          title="Re-center map"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
      </div>

      {editable && !routeStats.distanceMeters && (
        <div className="mt-4">
          <button
            onClick={generateCircularRoute}
            disabled={generatingRoute}
            className="w-full px-4 py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
          >
            {generatingRoute ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span>Generating Route...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                <span>Generate {durationMinutes}-Minute Walking Route</span>
              </>
            )}
          </button>
        </div>
      )}

      {routeStats.distanceMeters > 0 && (
        <div className="mt-4 bg-gradient-to-r from-teal-50 to-blue-50 rounded-xl p-4 border border-teal-100">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Route Summary
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="text-teal-600 font-medium text-xs mb-1">Distance</div>
              <div className="text-xl font-bold text-teal-900">
                {(routeStats.distanceMeters / 1000).toFixed(2)} km
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {routeStats.distanceMeters.toLocaleString()} meters
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
          <div className="mt-3 bg-white p-3 rounded-lg shadow-sm">
            <div className="flex items-center text-xs text-slate-600">
              <svg className="w-4 h-4 mr-2 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Circular route starting and ending at client address</span>
            </div>
          </div>
          
          {editable && (
            <button
              onClick={generateCircularRoute}
              disabled={generatingRoute}
              className="mt-3 w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 disabled:opacity-50 transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Regenerate Route
            </button>
          )}
        </div>
      )}
    </div>
  );
}
