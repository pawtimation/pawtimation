import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../config';
import { auth } from '../lib/auth';

export function AdminMetrics() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    supportHandled: 0,
    supportTotal: 0,
    csat: 0,
    csatResponses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      const response = await fetch(`${API_BASE}/admin/metrics`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMetrics(data.metrics || metrics);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  const supportHandledPercent = metrics.supportTotal > 0 
    ? Math.round((metrics.supportHandled / metrics.supportTotal) * 100)
    : 0;

  const avgCSAT = metrics.csatResponses > 0
    ? (metrics.csat / metrics.csatResponses).toFixed(1)
    : 'N/A';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-brand-ink">Platform Metrics</h2>
        <button onClick={() => navigate('/admin')} className="text-slate-600 hover:text-slate-800">← Back</button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500">Loading metrics...</div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                📅
              </div>
              <div>
                <div className="text-sm text-slate-600">Total Bookings</div>
                <div className="text-3xl font-bold text-brand-ink">{metrics.totalBookings}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">All-time completed bookings</div>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-2xl">
                💬
              </div>
              <div>
                <div className="text-sm text-slate-600">Support Handled</div>
                <div className="text-3xl font-bold text-brand-ink">{supportHandledPercent}%</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              {metrics.supportHandled} of {metrics.supportTotal} conversations resolved
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center text-2xl">
                ⭐
              </div>
              <div>
                <div className="text-sm text-slate-600">CSAT Score</div>
                <div className="text-3xl font-bold text-brand-ink">{avgCSAT}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Customer satisfaction (1-5 scale, {metrics.csatResponses} responses)
            </div>
          </div>

          <div className="bg-white border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
              <div>
                <div className="text-sm text-slate-600">Platform Health</div>
                <div className="text-3xl font-bold text-green-600">Good</div>
              </div>
            </div>
            <div className="text-xs text-slate-500">All systems operational</div>
          </div>
        </div>
      )}
    </div>
  );
}
