import { lazy, Suspense } from 'react';

const RechartsLineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const RechartsBarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const RechartsPieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })));
const RechartsLine = lazy(() => import('recharts').then(m => ({ default: m.Line })));
const RechartsBar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
const RechartsPie = lazy(() => import('recharts').then(m => ({ default: m.Pie })));
const RechartsXAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
const RechartsYAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
const RechartsCartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
const RechartsTooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
const RechartsLegend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));
const RechartsResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
const RechartsCell = lazy(() => import('recharts').then(m => ({ default: m.Cell })));

const ChartLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

export function LineChart(props) {
  return (
    <Suspense fallback={<ChartLoader />}>
      <RechartsLineChart {...props} />
    </Suspense>
  );
}

export function BarChart(props) {
  return (
    <Suspense fallback={<ChartLoader />}>
      <RechartsBarChart {...props} />
    </Suspense>
  );
}

export function PieChart(props) {
  return (
    <Suspense fallback={<ChartLoader />}>
      <RechartsPieChart {...props} />
    </Suspense>
  );
}

export function Line(props) {
  return (
    <Suspense fallback={null}>
      <RechartsLine {...props} />
    </Suspense>
  );
}

export function Bar(props) {
  return (
    <Suspense fallback={null}>
      <RechartsBar {...props} />
    </Suspense>
  );
}

export function Pie(props) {
  return (
    <Suspense fallback={null}>
      <RechartsPie {...props} />
    </Suspense>
  );
}

export function XAxis(props) {
  return (
    <Suspense fallback={null}>
      <RechartsXAxis {...props} />
    </Suspense>
  );
}

export function YAxis(props) {
  return (
    <Suspense fallback={null}>
      <RechartsYAxis {...props} />
    </Suspense>
  );
}

export function CartesianGrid(props) {
  return (
    <Suspense fallback={null}>
      <RechartsCartesianGrid {...props} />
    </Suspense>
  );
}

export function Tooltip(props) {
  return (
    <Suspense fallback={null}>
      <RechartsTooltip {...props} />
    </Suspense>
  );
}

export function Legend(props) {
  return (
    <Suspense fallback={null}>
      <RechartsLegend {...props} />
    </Suspense>
  );
}

export function ResponsiveContainer(props) {
  return (
    <Suspense fallback={null}>
      <RechartsResponsiveContainer {...props} />
    </Suspense>
  );
}

export function Cell(props) {
  return (
    <Suspense fallback={null}>
      <RechartsCell {...props} />
    </Suspense>
  );
}
