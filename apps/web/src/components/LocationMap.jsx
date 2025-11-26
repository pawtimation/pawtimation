import React, { useMemo } from 'react';
import { isMapsEnabled } from '../lib/mapsEnabled';

export function LocationMap({ lat, lng, address, height = 200, className = '' }) {
  if (!isMapsEnabled()) {
    return (
      <div className={`space-y-2 ${className}`}>
        <div className="text-sm font-medium text-slate-700">Service Location</div>
        {address && (
          <div className="text-xs text-slate-600 flex items-start gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
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

  // Use Google Maps embed (free, no API key required for basic embeds)
  const mapEmbedUrl = hasValidCoords
    ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d2000!2d${coords.lng}!3d${coords.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2suk!4v1`
    : address
      ? `https://www.google.com/maps/embed/v1/place?key=&q=${encodeURIComponent(address)}`
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
      
      {hasValidCoords ? (
        <div 
          className="relative w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200"
          style={{ height: `${height}px` }}
        >
          <iframe
            src={mapEmbedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Location map"
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
