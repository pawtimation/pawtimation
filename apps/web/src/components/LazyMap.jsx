import { lazy, Suspense } from 'react';

const LazyMapLibreRouteMap = lazy(() => import('./MapLibreRouteMap').then(m => ({ default: m.MapLibreRouteMap })));
const LazyReadOnlyRouteMap = lazy(() => import('./ReadOnlyRouteMap').then(m => ({ default: m.ReadOnlyRouteMap })));

const MapLoader = () => (
  <div className="flex items-center justify-center h-96 bg-slate-100 rounded-lg">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
      <p className="text-sm text-slate-600">Loading map...</p>
    </div>
  </div>
);

export function InteractiveRouteMap(props) {
  return (
    <Suspense fallback={<MapLoader />}>
      <LazyMapLibreRouteMap {...props} />
    </Suspense>
  );
}

export function MapLibreRouteMap(props) {
  return (
    <Suspense fallback={<MapLoader />}>
      <LazyMapLibreRouteMap {...props} />
    </Suspense>
  );
}

export function ReadOnlyRouteMap(props) {
  return (
    <Suspense fallback={<MapLoader />}>
      <LazyReadOnlyRouteMap {...props} />
    </Suspense>
  );
}
