import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

// Simple fallback component when map can't be rendered
function SimpleAddressDisplay({ address, lat, lng, className }) {
  const displayLat = typeof lat === 'number' ? lat : null;
  const displayLng = typeof lng === 'number' ? lng : null;
  
  const mapsLink = address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : displayLat && displayLng ? `https://www.google.com/maps/search/?api=1&query=${displayLat},${displayLng}` : '#';

  return (
    <div className={`space-y-2 ${className || ''}`}>
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
          <div className="font-medium">{address || (displayLat && displayLng ? `${displayLat}, ${displayLng}` : 'Location')}</div>
          {displayLat && displayLng && (
            <div className="text-slate-500 mt-1">Coordinates: {displayLat}, {displayLng}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export function LocationMap({ lat, lng, address, height = 300, className = '' }) {
  // Parse and validate coordinates - must be valid numbers
  const coords = useMemo(() => {
    const parsedLat = typeof lat === 'number' ? lat : typeof lat === 'string' ? parseFloat(lat) : NaN;
    const parsedLng = typeof lng === 'number' ? lng : typeof lng === 'string' ? parseFloat(lng) : NaN;
    
    if (isNaN(parsedLat) || isNaN(parsedLng)) {
      return null;
    }
    
    // Return as tuple for react-leaflet
    return { lat: parsedLat, lng: parsedLng };
  }, [lat, lng]);
  
  const hasValidCoords = coords !== null && coords.lat !== 0 && coords.lng !== 0;
  
  // No valid coordinates - return null
  if (!hasValidCoords && !address) {
    return null;
  }

  const mapsLink = address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : hasValidCoords ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` : '#';

  // If no MapTiler key or no valid coords, show simple display
  if (!MAPTILER_KEY || !hasValidCoords) {
    return <SimpleAddressDisplay address={address} lat={coords?.lat} lng={coords?.lng} className={className} />;
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
          center={[coords.lat, coords.lng]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
          attributionControl={true}
        >
          <TileLayer
            attribution='MapTiler / OpenStreetMap'
            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
          />
          <Marker position={[coords.lat, coords.lng]} />
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
