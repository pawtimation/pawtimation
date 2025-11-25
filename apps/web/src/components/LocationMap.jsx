import React, { useMemo } from 'react';

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_API_KEY || '';

export function LocationMap({ lat, lng, address, height = 200, className = '' }) {
  const coords = useMemo(() => {
    const parsedLat = typeof lat === 'number' ? lat : typeof lat === 'string' ? parseFloat(lat) : NaN;
    const parsedLng = typeof lng === 'number' ? lng : typeof lng === 'string' ? parseFloat(lng) : NaN;
    
    if (isNaN(parsedLat) || isNaN(parsedLng) || parsedLat === 0 || parsedLng === 0) {
      return null;
    }
    
    return { lat: parsedLat, lng: parsedLng };
  }, [lat, lng]);
  
  const hasValidCoords = coords !== null;

  if (!hasValidCoords && !address) {
    return null;
  }

  const mapsLink = address 
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : hasValidCoords 
      ? `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}` 
      : '#';

  const staticMapUrl = hasValidCoords && MAPTILER_KEY
    ? `https://api.maptiler.com/maps/streets-v2/static/${coords.lng},${coords.lat},15/400x${height}@2x.png?key=${MAPTILER_KEY}&markers=${coords.lng},${coords.lat}`
    : null;

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
      
      {staticMapUrl ? (
        <div 
          className="relative w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
          style={{ height: `${height}px` }}
        >
          <img
            src={staticMapUrl}
            alt="Location map"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div 
          className="relative w-full bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center"
          style={{ height: `${height}px` }}
        >
          <div className="text-center text-slate-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="text-xs">Map preview unavailable</div>
          </div>
        </div>
      )}
      
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
