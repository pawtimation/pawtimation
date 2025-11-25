import React, { useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// Simple fallback component when map can't be rendered
function SimpleAddressDisplay({ address, lat, lng, className }) {
  const mapsLink = address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-slate-700">Service Location</div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
        >
          Open in Google Maps
        </a>
      </div>
      
      <div className="text-xs text-slate-600 flex items-start gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <div>
          <div className="font-medium">{address || `${lat}, ${lng}`}</div>
          {lat && lng && (
            <div className="text-slate-500 mt-1">Coordinates: {lat}, {lng}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LocationMap({ lat, lng, address, height = 300, className = '' }) {
  const [mapError, setMapError] = useState(false);
  
  // Parse coordinates as numbers to prevent react-leaflet errors
  const parsedLat = useMemo(() => {
    const val = typeof lat === 'string' ? parseFloat(lat) : Number(lat);
    return isNaN(val) ? null : val;
  }, [lat]);
  
  const parsedLng = useMemo(() => {
    const val = typeof lng === 'string' ? parseFloat(lng) : Number(lng);
    return isNaN(val) ? null : val;
  }, [lng]);
  
  // Create icon only when needed
  const locationIcon = useMemo(() => {
    try {
      return L.divIcon({
        html: `<div style="background: #2BA39B; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 4px 12px rgba(43, 163, 155, 0.4);">
          <svg style="width: 20px; height: 20px; color: white;" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>`,
        className: 'location-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      });
    } catch (e) {
      console.error('Failed to create map icon:', e);
      return null;
    }
  }, []);
  
  const hasCoords = parsedLat !== null && parsedLng !== null && parsedLat !== 0 && parsedLng !== 0;
  
  if (!hasCoords) {
    return null;
  }
  
  // If we had an error or icon failed to create, show simple fallback
  if (mapError || !locationIcon) {
    return <SimpleAddressDisplay address={address} lat={parsedLat} lng={parsedLng} className={className} />;
  }

  const mapsLink = address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : `https://www.google.com/maps/search/?api=1&query=${parsedLat},${parsedLng}`;

  // If no MapTiler key, show simple display
  if (!MAPTILER_KEY) {
    return <SimpleAddressDisplay address={address} lat={parsedLat} lng={parsedLng} className={className} />;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-slate-700">Service Location</div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
        >
          Open in Google Maps
        </a>
      </div>
      
      <div 
        className="relative w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
        style={{ height: `${height}px` }}
      >
        <MapContainer
          center={[parsedLat, parsedLng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='MapTiler / OpenStreetMap'
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
          />
          <Marker position={[parsedLat, parsedLng]} icon={locationIcon} />
        </MapContainer>
      </div>
      
      {address && (
        <div className="text-xs text-slate-600 flex items-start gap-2">
          <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>{address}</span>
        </div>
      )}
    </div>
  );
}
