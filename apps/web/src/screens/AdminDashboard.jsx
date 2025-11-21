import React, { useEffect, useState } from "react";
import DashboardCard from "../components/layout/DashboardCard";
import { api } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

const BRAND_COLORS = {
  primary: '#20D6C7',
  secondary: '#0FAE7B',
  tertiary: '#17C3B2',
  dark: '#0E9385',
  light: '#A0F0E5'
};

const CHART_COLORS = [
  BRAND_COLORS.primary,
  BRAND_COLORS.secondary,
  BRAND_COLORS.tertiary,
  BRAND_COLORS.dark,
  '#F59E0B',
  '#EF4444'
];

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
        color: CHART_COLORS[idx % CHART_COLORS.length]
      }));

      const staffData = (breakdowns.byStaff || []).map((s, idx) => ({
        name: s.staffName || 'Unassigned',
        jobs: s.count || 0,
        fill: CHART_COLORS[idx % CHART_COLORS.length]
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

  // Empty state component with illustration
  const EmptyState = ({ title, icon }) => (
    <div className="h-64 flex flex-col items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-4 opacity-40">
        <circle cx="60" cy="60" r="50" fill={BRAND_COLORS.light} fillOpacity="0.2"/>
        <path d="M40 70 Q60 50 80 70" stroke={BRAND_COLORS.primary} strokeWidth="3" strokeLinecap="round" fill="none"/>
        <circle cx="45" cy="65" r="4" fill={BRAND_COLORS.primary}/>
        <circle cx="60" cy="52" r="4" fill={BRAND_COLORS.primary}/>
        <circle cx="75" cy="65" r="4" fill={BRAND_COLORS.primary}/>
        {icon === 'dog' && (
          <>
            <ellipse cx="60" cy="75" rx="15" ry="12" fill={BRAND_COLORS.primary} fillOpacity="0.2"/>
            <circle cx="55" cy="72" r="2" fill={BRAND_COLORS.dark}/>
            <circle cx="65" cy="72" r="2" fill={BRAND_COLORS.dark}/>
            <path d="M50 70 Q50 65 45 65 M70 70 Q70 65 75 65" stroke={BRAND_COLORS.dark} strokeWidth="2" strokeLinecap="round" fill="none"/>
          </>
        )}
      </svg>
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-xs text-gray-400 mt-1">Create bookings to see data appear</p>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-10 py-12 space-y-8">
        
        {/* Top Stats - Clean & Simple */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Upcoming Jobs</p>
            <p className="text-4xl font-bold text-gray-900">{stats.upcomingJobs}</p>
            <div className="mt-2 flex items-center text-xs text-teal-600">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
              Active
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Pending Approvals</p>
            <p className={`text-4xl font-bold ${stats.pendingRequests > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
              {stats.pendingRequests}
            </p>
            {stats.pendingRequests > 0 && (
              <div className="mt-2 flex items-center text-xs text-orange-600">
                <span className="inline-block w-2 h-2 rounded-full bg-orange-500 mr-2"></span>
                Needs attention
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Active Clients</p>
            <p className="text-4xl font-bold text-gray-900">{stats.activeClients}</p>
            <div className="mt-2 flex items-center text-xs text-teal-600">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
              Current
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Revenue (This Week)</p>
            <p className="text-4xl font-bold text-gray-900">£{(stats.revenueWeek / 100).toFixed(2)}</p>
            <div className="mt-2 flex items-center text-xs text-teal-600">
              <span className="inline-block w-2 h-2 rounded-full bg-teal-500 mr-2"></span>
              Last 7 days
            </div>
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Jobs Over Time */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Jobs over time</h3>
            {chartData.jobsOverTime.length > 0 && chartData.jobsOverTime.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData.jobsOverTime}>
                  <defs>
                    <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND_COLORS.primary} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={BRAND_COLORS.primary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [value, 'Jobs']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke={BRAND_COLORS.primary}
                    strokeWidth={3}
                    fill="url(#jobsGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No booking data yet" icon="chart" />
            )}
          </div>

          {/* Service Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Service breakdown</h3>
            {chartData.serviceBreakdown.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="50%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
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
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-3 pl-6">
                  {chartData.serviceBreakdown.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div 
                          className="w-3 h-3 rounded-full mr-3" 
                          style={{ backgroundColor: entry.color }}
                        ></div>
                        <span className="text-sm text-gray-700">{entry.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState title="No service data yet" icon="dog" />
            )}
          </div>

          {/* Staff Workload */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Staff workload</h3>
            {chartData.staffWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.staffWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="jobs"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.staffWorkload.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No staff data yet" icon="chart" />
            )}
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-6">Revenue trend</h3>
            {chartData.revenueForecast.length > 0 && chartData.revenueForecast.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData.revenueForecast}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND_COLORS.primary} />
                      <stop offset="100%" stopColor={BRAND_COLORS.secondary} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    axisLine={{ stroke: '#e2e8f0' }}
                    tickLine={false}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 13,
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="revenue"
                    radius={[8, 8, 0, 0]}
                    fill="url(#barGradient)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState title="No revenue data yet" icon="chart" />
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
