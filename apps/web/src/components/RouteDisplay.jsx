import React from 'react';

/**
 * RouteDisplay Component
 * Shows a walking route with static map preview, distance, and duration
 */
export function RouteDisplay({ route, onNavigate, showNavigation = false }) {
  if (!route) {
    return null;
  }

  const distanceKm = (route.distanceMeters / 1000).toFixed(2);
  const lastGenerated = route.generatedAt 
    ? new Date(route.generatedAt).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      })
    : null;

  // Extract coordinates for map display
  const coords = route.geojson?.geometry?.coordinates || [];
  const center = coords[0] || [0, 0];
  
  // Create static map URL using Google Maps Static API (iframe embed)
  const mapUrl = coords.length > 0
    ? `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${center[1]},${center[0]}&destination=${center[1]},${center[0]}&mode=walking`
    : null;

  // Fallback: simple OSM-based map
  const osmMapUrl = coords.length > 0
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${center[0]-0.01},${center[1]-0.01},${center[0]+0.01},${center[1]+0.01}&layer=mapnik&marker=${center[1]},${center[0]}`
    : null;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Suggested Walking Route</h3>
        {lastGenerated && (
          <span className="text-xs text-slate-500">
            Generated {lastGenerated}
          </span>
        )}
      </div>

      {/* Map Preview */}
      {osmMapUrl && (
        <div className="relative w-full h-48 bg-slate-100 rounded overflow-hidden">
          <iframe
            src={osmMapUrl}
            width="100%"
            height="100%"
            frameBorder="0"
            className="absolute inset-0"
            title="Walking Route Map"
          />
        </div>
      )}

      {/* Route Info */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-teal-50 p-3 rounded">
          <div className="text-teal-600 font-medium">Distance</div>
          <div className="text-lg font-semibold text-teal-900">{distanceKm} km</div>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <div className="text-blue-600 font-medium">Duration</div>
          <div className="text-lg font-semibold text-blue-900">{route.durationMinutes} min</div>
        </div>
      </div>

      {/* Navigation Button */}
      {showNavigation && onNavigate && (
        <button
          onClick={onNavigate}
          className="w-full btn btn-primary flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          Start Navigation
        </button>
      )}

      {/* Route Details */}
      <div className="text-xs text-slate-500 border-t pt-2">
        <p>Circular walking route starting and ending at client's address</p>
      </div>
    </div>
  );
}

/**
 * RouteGenerator Component
 * Button and UI for generating a walking route
 */
export function RouteGenerator({ bookingId, onRouteGenerated, loading, disabled }) {
  const [generating, setGenerating] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch(`/api/bookings/${bookingId}/generate-route`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate route');
      }

      const data = await response.json();
      if (onRouteGenerated) {
        onRouteGenerated(data.route);
      }
    } catch (err) {
      setError(err.message);
      console.error('Route generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleGenerate}
        disabled={disabled || generating || loading}
        className="btn btn-secondary w-full flex items-center justify-center gap-2"
      >
        {generating ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
            Generating Route...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Generate Suggested Route
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
