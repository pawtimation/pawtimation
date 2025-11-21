import React, { useEffect, useState } from "react";
import DashboardCard from "../components/layout/DashboardCard";
import { api } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

// Vibrant brand color palette
const COLORS = {
  teal: '#20D6C7',
  cyan: '#06B6D4',
  indigo: '#6366F1',
  purple: '#A855F7',
  pink: '#EC4899',
  slate: '#64748B',
  orange: '#F97316',
  emerald: '#10B981'
};

const CHART_PALETTE = [COLORS.teal, COLORS.cyan, COLORS.indigo, COLORS.purple, COLORS.pink, COLORS.emerald];

export function AdminDashboard() {
  const [stats, setStats] = useState({
    upcomingJobs: 0,
    pendingRequests: 0,
    activeClients: 0,
    revenueWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    jobsOverTime: [],
    serviceBreakdown: [],
    staffWorkload: [],
    revenueForecast: []
  });
  const { scopedTriggers } = useDataRefresh();

  const loadStats = async () => {
    try {
      const [upcomingRes, pendingRes, clientsRes, revenueRes] = await Promise.all([
        api("/stats/bookings/upcoming-count"),
        api("/stats/bookings/pending-count"),
        api("/stats/clients/count"),
        api("/stats/invoices/revenue-week")
      ]);

      const [upcoming, pending, clients, revenue] = await Promise.all([
        upcomingRes.json(),
        pendingRes.json(),
        clientsRes.json(),
        revenueRes.json()
      ]);

      setStats({
        upcomingJobs: upcoming.count || 0,
        pendingRequests: pending.count || 0,
        activeClients: clients.count || 0,
        revenueWeek: revenue.amount || 0
      });
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async () => {
    try {
      const [jobsRes, breakdownsRes, overviewRes] = await Promise.all([
        api("/bookings/list"),
        api("/finance/breakdowns"),
        api("/finance/overview")
      ]);

      const [jobs, breakdowns, overview] = await Promise.all([
        jobsRes.json(),
        breakdownsRes.json(),
        overviewRes.json()
      ]);

      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = dayjs().subtract(29 - i, 'day');
        return {
          date: date.format('YYYY-MM-DD'),
          label: date.format('MMM D'),
          count: 0
        };
      });

      jobs.forEach(job => {
        const jobDate = dayjs(job.start).format('YYYY-MM-DD');
        const dayData = last30Days.find(d => d.date === jobDate);
        if (dayData) {
          dayData.count++;
        }
      });

      const serviceData = (breakdowns.byService || []).map((s, idx) => ({
        name: s.serviceName || 'Unknown',
        value: s.count || 0,
        color: CHART_PALETTE[idx % CHART_PALETTE.length]
      }));

      const staffData = (breakdowns.byStaff || []).map((s, idx) => ({
        name: s.staffName || 'Unassigned',
        jobs: s.count || 0,
        fill: CHART_PALETTE[idx % CHART_PALETTE.length]
      }));

      const revenueData = (overview.monthlyTrend || []).map(m => ({
        month: dayjs(m.month).format('MMM'),
        revenue: (m.revenue || 0) / 100
      }));

      setChartData({
        jobsOverTime: last30Days,
        serviceBreakdown: serviceData.slice(0, 6),
        staffWorkload: staffData.slice(0, 6),
        revenueForecast: revenueData
      });
    } catch (err) {
      console.error("Failed to load chart data:", err);
    }
  };

  useEffect(() => {
    loadStats();
    loadChartData();
  }, []);

  useEffect(() => {
    loadStats();
    loadChartData();
  }, [scopedTriggers.bookings, scopedTriggers.invoices, scopedTriggers.stats]);

  // Illustrated empty state
  const EmptyChartState = ({ message }) => (
    <div className="h-80 flex flex-col items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="mb-4">
        <defs>
          <linearGradient id="emptyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={COLORS.teal} stopOpacity="0.2"/>
            <stop offset="100%" stopColor={COLORS.indigo} stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r="60" fill="url(#emptyGradient)"/>
        <path d="M45 85 Q70 60 95 85" stroke={COLORS.teal} strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.4"/>
        <circle cx="50" cy="82" r="5" fill={COLORS.cyan} opacity="0.5"/>
        <circle cx="70" cy="63" r="5" fill={COLORS.indigo} opacity="0.5"/>
        <circle cx="90" cy="82" r="5" fill={COLORS.purple} opacity="0.5"/>
        <ellipse cx="70" cy="95" rx="18" ry="15" fill={COLORS.teal} fillOpacity="0.15"/>
        <circle cx="64" cy="91" r="2.5" fill={COLORS.slate}/>
        <circle cx="76" cy="91" r="2.5" fill={COLORS.slate}/>
        <path d="M54 88 Q54 82 48 82 M86 88 Q86 82 92 82" stroke={COLORS.slate} strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
      <p className="text-sm font-medium text-gray-600">{message}</p>
      <p className="text-xs text-gray-400 mt-2">Data will appear as you create bookings</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-10 py-12 space-y-8">
        
        {/* Hero Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Upcoming Jobs - HERO CARD */}
          <div className="relative bg-gradient-to-br from-teal-500 via-cyan-500 to-indigo-500 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full -ml-12 -mb-12"></div>
            <div className="relative">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-white/90">Upcoming Jobs</p>
                <svg className="w-10 h-10 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                </svg>
              </div>
              <p className="text-5xl font-bold mb-1">{stats.upcomingJobs}</p>
              <p className="text-xs text-white/80">Active bookings</p>
            </div>
          </div>

          {/* Pending Approvals - CONDITIONAL ORANGE */}
          <div className={`relative ${stats.pendingRequests > 0 ? 'bg-gradient-to-br from-orange-500 to-pink-500 text-white' : 'bg-white border border-gray-200 text-gray-900'} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-2">
              <p className={`text-sm font-medium ${stats.pendingRequests > 0 ? 'text-white/90' : 'text-gray-600'}`}>Pending Approvals</p>
              {stats.pendingRequests > 0 && (
                <svg className="w-10 h-10 text-white/30" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
              )}
            </div>
            <p className="text-5xl font-bold mb-1">{stats.pendingRequests}</p>
            {stats.pendingRequests > 0 ? (
              <p className="text-xs text-white/80">Require attention</p>
            ) : (
              <p className="text-xs text-gray-500">All clear</p>
            )}
          </div>

          {/* Active Clients */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Active Clients</p>
              <svg className="w-10 h-10 text-purple-400/40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
              </svg>
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-1">{stats.activeClients}</p>
            <p className="text-xs text-gray-500">Total clients</p>
          </div>

          {/* Revenue */}
          <div className="relative bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
              <svg className="w-10 h-10 text-emerald-400/40" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
            <p className="text-5xl font-bold text-gray-900 mb-1">£{(stats.revenueWeek / 100).toFixed(0)}</p>
            <p className="text-xs text-gray-500">Last 7 days</p>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Jobs Over Time - FULL WIDTH HERO */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">Jobs over time</h3>
              <span className="text-xs px-3 py-1 bg-teal-50 text-teal-700 rounded-full font-medium">Last 30 days</span>
            </div>
            {chartData.jobsOverTime.length > 0 && chartData.jobsOverTime.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={chartData.jobsOverTime}>
                  <defs>
                    <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.teal} stopOpacity={0.4}/>
                      <stop offset="95%" stopColor={COLORS.teal} stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={5}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    formatter={(value) => [value, 'Jobs']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={COLORS.teal}
                    strokeWidth={3}
                    fill="url(#jobsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No booking activity yet" />
            )}
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Service breakdown</h3>
            {chartData.serviceBreakdown.length > 0 ? (
              <div className="flex items-center">
                <ResponsiveContainer width="45%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 13,
                        backgroundColor: '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        padding: '12px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3">
                  {chartData.serviceBreakdown.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3 group-hover:scale-110 transition-transform" 
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChartState message="No service data yet" />
            )}
          </div>

          {/* Staff Workload */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Staff workload</h3>
            {chartData.staffWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.staffWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="jobs"
                    radius={[10, 10, 0, 0]}
                  >
                    {chartData.staffWorkload.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChartState message="No staff assignments yet" />
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
