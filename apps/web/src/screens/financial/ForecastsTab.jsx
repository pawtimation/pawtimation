import React, { useEffect, useState } from 'react';
import { api } from '../../lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function ForecastsTab({ business }) {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [business]);

  async function loadData() {
    if (!business) return;
    
    try {
      setLoading(true);
      const res = await api('/finance/forecasts');
      
      if (res.ok) {
        const data = await res.json();
        setForecast(data.forecast);
      }
    } catch (err) {
      console.error('Failed to load forecasts', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading forecasts...</div>;
  }

  if (!forecast) {
    return <div className="text-center py-8">No forecast data available</div>;
  }

  const formatCurrency = (cents) => `£${((cents || 0) / 100).toFixed(2)}`;

  // Backend returns cents, divide by 100 for chart display in GBP
  const chartData = [
    {
      period: '30 Days',
      scheduled: (forecast.forecast30Days?.scheduledRevenueCents || 0) / 100,
      projected: (forecast.forecast30Days?.projectedRevenueCents || 0) / 100,
      total: (forecast.forecast30Days?.totalForecastCents || 0) / 100
    },
    {
      period: '60 Days',
      scheduled: (forecast.forecast60Days?.scheduledRevenueCents || 0) / 100,
      projected: (forecast.forecast60Days?.projectedRevenueCents || 0) / 100,
      total: (forecast.forecast60Days?.totalForecastCents || 0) / 100
    },
    {
      period: '90 Days',
      scheduled: (forecast.forecast90Days?.scheduledRevenueCents || 0) / 100,
      projected: (forecast.forecast90Days?.projectedRevenueCents || 0) / 100,
      total: (forecast.forecast90Days?.totalForecastCents || 0) / 100
    }
  ];

  return (
    <div className="space-y-6">
      {/* Forecast Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="text-sm text-slate-600 mb-1">30-Day Forecast</div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(forecast.forecast30Days?.totalForecastCents || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <div>Scheduled: {formatCurrency(forecast.forecast30Days?.scheduledRevenueCents || 0)}</div>
            <div>Projected: {formatCurrency(forecast.forecast30Days?.projectedRevenueCents || 0)}</div>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-600 mb-1">60-Day Forecast</div>
          <div className="text-2xl font-bold text-teal-600">
            {formatCurrency(forecast.forecast60Days?.totalForecastCents || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <div>Scheduled: {formatCurrency(forecast.forecast60Days?.scheduledRevenueCents || 0)}</div>
            <div>Projected: {formatCurrency(forecast.forecast60Days?.projectedRevenueCents || 0)}</div>
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-600 mb-1">90-Day Forecast</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(forecast.forecast90Days?.totalForecastCents || 0)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            <div>Scheduled: {formatCurrency(forecast.forecast90Days?.scheduledRevenueCents || 0)}</div>
            <div>Projected: {formatCurrency(forecast.forecast90Days?.projectedRevenueCents || 0)}</div>
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Revenue Forecast Breakdown</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="period" 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#64748b"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `£${value.toFixed(0)}`}
            />
            <Tooltip 
              formatter={(value) => [`£${value.toFixed(2)}`, '']}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '8px'
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
            <Bar dataKey="scheduled" fill="#10b981" name="Scheduled Bookings" />
            <Bar dataKey="projected" fill="#3b82f6" name="Projected Revenue" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Explanation Card */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How Forecasts Work</h3>
        <div className="text-xs text-blue-800 space-y-1">
          <p>
            <strong>Scheduled Revenue:</strong> Total value of confirmed bookings in the forecast period.
          </p>
          <p>
            <strong>Projected Revenue:</strong> Estimated additional revenue based on your average daily earnings from the last 90 days.
          </p>
          <p>
            <strong>Total Forecast:</strong> Sum of scheduled bookings and projected revenue, giving you a realistic estimate of future earnings.
          </p>
          <p className="mt-2">
            Daily average: {formatCurrency(forecast.avgDailyRevenueCents || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}
