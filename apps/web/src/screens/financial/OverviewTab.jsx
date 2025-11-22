import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/auth';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from '../../components/LazyCharts';

export function OverviewTab({ business }) {
  const [overview, setOverview] = useState(null);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [business]);

  async function loadData() {
    if (!business) return;
    
    try {
      setLoading(true);
      const res = await adminApi('/finance/overview');
      
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setMonthlyTrend(data.monthlyTrend);
      }
    } catch (err) {
      console.error('Failed to load financial overview', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading financial overview...</div>;
  }

  if (!overview) {
    return <div className="text-center py-8">No data available</div>;
  }

  const formatCurrency = (cents) => `£${((cents || 0) / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-slate-600 mb-1">Total Revenue</div>
          <div className="text-2xl font-bold text-emerald-600">
            {formatCurrency(overview.totalRevenueCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview.totalInvoices} invoices
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-600 mb-1">Avg Booking Value</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(overview.avgBookingValueCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {overview.totalBookings} completed
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-600 mb-1">This Month</div>
          <div className="text-2xl font-bold text-teal-600">
            {formatCurrency(overview.thisMonthRevenueCents)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Current month
          </div>
        </div>

        <div className="card">
          <div className="text-sm text-slate-600 mb-1">Monthly Growth</div>
          <div className={`text-2xl font-bold ${overview.monthlyGrowthPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overview.monthlyGrowthPercent >= 0 ? '+' : ''}{overview.monthlyGrowthPercent}%
          </div>
          <div className="text-xs text-slate-500 mt-1">
            vs last month
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Revenue Trend (Last 6 Months)</h2>
        
        {monthlyTrend.length === 0 ? (
          <p className="text-sm text-slate-600">No revenue data available yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#64748b"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `£${(value / 100).toFixed(0)}`}
              />
              <Tooltip 
                formatter={(value) => [`£${(value / 100).toFixed(2)}`, 'Revenue']}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenueCents" 
                stroke="#10b981" 
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      {monthlyTrend.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Monthly Breakdown</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-600 border-b">
                <th className="pb-2">Month</th>
                <th className="pb-2 text-right">Revenue</th>
                <th className="pb-2 text-right">Bookings</th>
                <th className="pb-2 text-right">Avg Value</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.slice().reverse().map((month) => {
                const avgValue = month.bookingCount > 0 
                  ? month.revenueCents / month.bookingCount 
                  : 0;
                
                return (
                  <tr key={month.monthKey} className="border-b last:border-b-0">
                    <td className="py-2">{month.month}</td>
                    <td className="py-2 text-right font-medium">
                      {formatCurrency(month.revenueCents)}
                    </td>
                    <td className="py-2 text-right">{month.bookingCount}</td>
                    <td className="py-2 text-right text-slate-600">
                      {formatCurrency(avgValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
