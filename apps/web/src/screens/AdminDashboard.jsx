import React, { useEffect, useState } from "react";
import DashboardCard from "../components/layout/DashboardCard";
import { api } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dayjs from 'dayjs';

const COLORS = ['#20D6C7', '#0FAE7B', '#17C3B2', '#0E9385', '#1FB6A8', '#14B8A6'];

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
    revenueForecast: [],
    revenueSparkline: [],
    jobsSparkline: []
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

      // Last 30 days for main chart
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

      // Last 7 days for sparklines
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = dayjs().subtract(6 - i, 'day');
        return {
          date: date.format('YYYY-MM-DD'),
          jobs: 0
        };
      });

      jobs.forEach(job => {
        const jobDate = dayjs(job.start).format('YYYY-MM-DD');
        const dayData = last7Days.find(d => d.date === jobDate);
        if (dayData) {
          dayData.jobs++;
        }
      });

      const serviceData = (breakdowns.byService || []).map((s, idx) => ({
        name: s.serviceName || 'Unknown',
        value: s.count || 0,
        color: COLORS[idx % COLORS.length]
      }));

      const staffData = (breakdowns.byStaff || []).map((s, idx) => ({
        name: s.staffName || 'Unassigned',
        jobs: s.count || 0,
        fill: COLORS[idx % COLORS.length]
      }));

      const revenueData = (overview.monthlyTrend || []).map(m => ({
        month: dayjs(m.month).format('MMM'),
        revenue: (m.revenue || 0) / 100
      }));

      // Revenue sparkline (last 6 months)
      const revenueSparkline = revenueData.map(d => ({
        value: d.revenue
      }));

      setChartData({
        jobsOverTime: last30Days,
        serviceBreakdown: serviceData.slice(0, 6),
        staffWorkload: staffData.slice(0, 6),
        revenueForecast: revenueData,
        revenueSparkline: revenueSparkline,
        jobsSparkline: last7Days
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-10 py-12 space-y-8">
        
        {/* Top Stats with Sparklines */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Upcoming Jobs */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Upcoming Jobs</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingJobs}</p>
              </div>
            </div>
            {chartData.jobsSparkline.length > 0 && (
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={chartData.jobsSparkline}>
                  <defs>
                    <linearGradient id="jobsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#20D6C7" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#20D6C7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="jobs" 
                    stroke="#20D6C7" 
                    strokeWidth={2}
                    fill="url(#jobsGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Pending Approvals</p>
                <p className={`text-3xl font-bold ${stats.pendingRequests > 0 ? 'text-orange-500' : 'text-gray-900'}`}>
                  {stats.pendingRequests}
                </p>
              </div>
            </div>
            <div className="h-12 flex items-end">
              {stats.pendingRequests > 0 && (
                <div className="w-full h-full bg-gradient-to-t from-orange-100 to-orange-50 rounded"></div>
              )}
            </div>
          </div>

          {/* Active Clients */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Active Clients</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeClients}</p>
              </div>
            </div>
            <div className="h-12 flex items-end space-x-1">
              {[...Array(Math.min(stats.activeClients, 12))].map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-gradient-to-t from-teal-500 to-teal-300 rounded-sm"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                ></div>
              ))}
            </div>
          </div>

          {/* Revenue */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-sm text-gray-500 mb-1">Revenue (This Week)</p>
                <p className="text-3xl font-bold text-gray-900">
                  £{(stats.revenueWeek / 100).toFixed(2)}
                </p>
              </div>
            </div>
            {chartData.revenueSparkline.length > 0 && (
              <ResponsiveContainer width="100%" height={50}>
                <AreaChart data={chartData.revenueSparkline}>
                  <defs>
                    <linearGradient id="revenueSparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0FAE7B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0FAE7B" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#0FAE7B" 
                    strokeWidth={2}
                    fill="url(#revenueSparkGradient)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Jobs Over Time */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Jobs over time</h3>
            {chartData.jobsOverTime.length > 0 && chartData.jobsOverTime.some(d => d.count > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={chartData.jobsOverTime}>
                  <defs>
                    <linearGradient id="jobsMainGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#20D6C7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#20D6C7" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    interval={6}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value} jobs`, 'Jobs']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#20D6C7" 
                    strokeWidth={3}
                    fill="url(#jobsMainGradient)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No booking data yet</p>
              </div>
            )}
          </div>

          {/* Service Breakdown - Donut Chart */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Service breakdown</h3>
            {chartData.serviceBreakdown.length > 0 ? (
              <div className="flex items-center">
                <ResponsiveContainer width="60%" height={280}>
                  <PieChart>
                    <Pie
                      data={chartData.serviceBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.serviceBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: 12,
                        backgroundColor: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                      }}
                      formatter={(value) => [`${value} jobs`, '']}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {chartData.serviceBreakdown.map((entry, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: entry.color }}
                      ></div>
                      <span className="text-gray-700 flex-1">{entry.name}</span>
                      <span className="font-semibold text-gray-900">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No service data yet</p>
              </div>
            )}
          </div>

          {/* Staff Workload */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Staff workload</h3>
            {chartData.staffWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.staffWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`${value} jobs`, 'Jobs']}
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
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No staff data yet</p>
              </div>
            )}
          </div>

          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Revenue trend</h3>
            {chartData.revenueForecast.length > 0 && chartData.revenueForecast.some(d => d.revenue > 0) ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData.revenueForecast}>
                  <defs>
                    <linearGradient id="barGradient1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#20D6C7" />
                      <stop offset="100%" stopColor="#0E9385" />
                    </linearGradient>
                    <linearGradient id="barGradient2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0FAE7B" />
                      <stop offset="100%" stopColor="#0E9385" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `£${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      fontSize: 12,
                      backgroundColor: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                    formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Bar 
                    dataKey="revenue"
                    radius={[8, 8, 0, 0]}
                    fill="url(#barGradient1)"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">No revenue data yet</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
