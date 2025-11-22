import React, { useEffect, useState } from 'react';
import { adminApi } from '../../lib/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from '../../components/LazyCharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export function BreakdownsTab({ business }) {
  const [breakdowns, setBreakdowns] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [business]);

  async function loadData() {
    if (!business) return;
    
    try {
      setLoading(true);
      const res = await adminApi('/finance/breakdowns');
      
      if (res.ok) {
        const data = await res.json();
        setBreakdowns(data);
      }
    } catch (err) {
      console.error('Failed to load breakdowns', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading revenue breakdowns...</div>;
  }

  if (!breakdowns) {
    return <div className="text-center py-8">No breakdown data available</div>;
  }

  const formatCurrency = (cents) => `£${((cents || 0) / 100).toFixed(2)}`;

  return (
    <div className="space-y-6">
      {/* Revenue by Service */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Revenue by Service</h2>
        
        {breakdowns.byService.length === 0 ? (
          <p className="text-sm text-slate-600">No service revenue data yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={breakdowns.byService.map(s => ({ ...s, revenue: (s.revenueCents || 0) / 100 }))} 
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="serviceName" 
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => `£${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {breakdowns.byService.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 border-b">
                    <th className="pb-2">Service</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Bookings</th>
                    <th className="pb-2 text-right">Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdowns.byService.map((service, idx) => {
                    const avgValue = service.bookingCount > 0 
                      ? service.revenueCents / service.bookingCount 
                      : 0;
                    
                    return (
                      <tr key={service.serviceId} className="border-b last:border-b-0">
                        <td className="py-2 flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          {service.serviceName}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(service.revenueCents)}
                        </td>
                        <td className="py-2 text-right">{service.bookingCount}</td>
                        <td className="py-2 text-right text-slate-600">
                          {formatCurrency(avgValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Revenue by Staff */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Revenue by Staff Member</h2>
        
        {breakdowns.byStaff.length === 0 ? (
          <p className="text-sm text-slate-600">No staff revenue data yet.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart 
                data={breakdowns.byStaff.map(s => ({ ...s, revenue: (s.revenueCents || 0) / 100 }))} 
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="staffName" 
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="#64748b"
                  style={{ fontSize: '11px' }}
                  tickFormatter={(value) => `£${value.toFixed(0)}`}
                />
                <Tooltip 
                  formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-600 border-b">
                    <th className="pb-2">Staff Member</th>
                    <th className="pb-2 text-right">Revenue</th>
                    <th className="pb-2 text-right">Bookings</th>
                    <th className="pb-2 text-right">Avg per Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdowns.byStaff.map((staff) => {
                    const avgValue = staff.bookingCount > 0 
                      ? staff.revenueCents / staff.bookingCount 
                      : 0;
                    
                    return (
                      <tr key={staff.staffId} className="border-b last:border-b-0">
                        <td className="py-2">{staff.staffName}</td>
                        <td className="py-2 text-right font-medium">
                          {formatCurrency(staff.revenueCents)}
                        </td>
                        <td className="py-2 text-right">{staff.bookingCount}</td>
                        <td className="py-2 text-right text-slate-600">
                          {formatCurrency(avgValue)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Top Clients */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Top 10 Clients by Revenue</h2>
        
        {breakdowns.byClient.length === 0 ? (
          <p className="text-sm text-slate-600">No client revenue data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-600 border-b">
                  <th className="pb-2">Rank</th>
                  <th className="pb-2">Client</th>
                  <th className="pb-2 text-right">Revenue</th>
                  <th className="pb-2 text-right">Invoices</th>
                  <th className="pb-2 text-right">Avg Invoice</th>
                </tr>
              </thead>
              <tbody>
                {breakdowns.byClient.map((client, index) => {
                  const avgInvoice = client.invoiceCount > 0 
                    ? client.revenueCents / client.invoiceCount 
                    : 0;
                  
                  return (
                    <tr key={client.clientId} className="border-b last:border-b-0">
                      <td className="py-2 text-slate-500">#{index + 1}</td>
                      <td className="py-2 font-medium">{client.clientName}</td>
                      <td className="py-2 text-right font-medium text-emerald-600">
                        {formatCurrency(client.revenueCents)}
                      </td>
                      <td className="py-2 text-right">{client.invoiceCount}</td>
                      <td className="py-2 text-right text-slate-600">
                        {formatCurrency(avgInvoice)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
