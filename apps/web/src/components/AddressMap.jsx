import React, { lazy, Suspense } from 'react';

const LazyLocationMap = lazy(() => import('./LocationMap').then(m => ({ default: m.LocationMap })));

const MapLoader = () => (
  <div className="flex items-center justify-center h-64 bg-slate-100 rounded-lg border border-slate-200">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-2"></div>
      <p className="text-xs text-slate-600">Loading map...</p>
    </div>
  </div>
);

export function AddressMap({ address, lat, lng, className = '' }) {
  const hasCoords = lat != null && lng != null;
  
  if (!address && !hasCoords) {
    return null;
  }

  if (hasCoords) {
    return (
      <Suspense fallback={<MapLoader />}>
        <LazyLocationMap 
          lat={lat} 
          lng={lng} 
          address={address} 
          height={300}
          className={className}
        />
      </Suspense>
    );
  }

  const cleanAddress = address?.trim();
  const encodedAddress = encodeURIComponent(cleanAddress);
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

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
          Open in Google Maps →
        </a>
      </div>
      
      <div className="text-xs text-slate-600 flex items-start gap-2 p-4 bg-slate-50 rounded-lg border border-slate-200">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{cleanAddress}</span>
      </div>
      <p className="text-xs text-slate-500 italic">💡 Add GPS coordinates to show an interactive map.</p>
    </div>
  );
}
