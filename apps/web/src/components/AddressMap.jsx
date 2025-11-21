import React from 'react';

export function AddressMap({ address, className = '' }) {
  if (!address) {
    return null;
  }

  const encodedAddress = encodeURIComponent(address);
  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=&q=${encodedAddress}`;
  const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center">
        <div className="text-sm font-medium text-slate-700">Location</div>
        <a
          href={mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
        >
          Open in Google Maps →
        </a>
      </div>
      
      <div className="relative w-full h-64 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
        <iframe
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://www.google.com/maps?q=${encodedAddress}&output=embed`}
          title={`Map showing ${address}`}
        />
      </div>
      
      <div className="text-xs text-slate-600 flex items-start gap-2">
        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{address}</span>
      </div>
    </div>
  );
}
