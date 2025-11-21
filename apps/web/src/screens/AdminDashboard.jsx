import React, { useEffect, useState } from "react";
import DashboardCard from "../components/layout/DashboardCard";
import { api } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dayjs from 'dayjs';

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

      const serviceData = (breakdowns.byService || []).map(s => ({
        name: s.serviceName || 'Unknown',
        jobs: s.count || 0
      }));

      const staffData = (breakdowns.byStaff || []).map(s => ({
        name: s.staffName || 'Unassigned',
        jobs: s.count || 0
      }));

      const revenueData = (overview.monthlyTrend || []).map(m => ({
        month: dayjs(m.month).format('MMM'),
        revenue: (m.revenue || 0) / 100
      }));

      setChartData({
        jobsOverTime: last30Days,
        serviceBreakdown: serviceData.slice(0, 5),
        staffWorkload: staffData.slice(0, 5),
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

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-10 py-12 space-y-12">
        
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Business Overview</h2>
          
          {loading ? (
            <p className="text-gray-600">Loading stats...</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <DashboardCard>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Upcoming Jobs</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.upcomingJobs}</p>
                </div>
              </DashboardCard>

              <DashboardCard>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Pending Approvals</p>
                  <p className={`text-3xl font-semibold ${stats.pendingRequests > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    {stats.pendingRequests}
                  </p>
                </div>
              </DashboardCard>

              <DashboardCard>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Active Clients</p>
                  <p className="text-3xl font-semibold text-gray-900">{stats.activeClients}</p>
                </div>
              </DashboardCard>

              <DashboardCard>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Revenue (This Week)</p>
                  <p className="text-3xl font-semibold text-gray-900">
                    £{(stats.revenueWeek / 100).toFixed(2)}
                  </p>
                </div>
              </DashboardCard>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Business Insights</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Jobs over time</h3>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={chartData.jobsOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} jobs`, 'Jobs']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#0d9488" 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Service breakdown</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData.serviceBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} jobs`, 'Jobs']}
                  />
                  <Bar dataKey="jobs" fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Staff workload</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData.staffWorkload}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`${value} jobs`, 'Jobs']}
                  />
                  <Bar dataKey="jobs" fill="#0891b2" />
                </BarChart>
              </ResponsiveContainer>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Revenue forecast</h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData.revenueForecast}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip 
                    contentStyle={{ fontSize: 12 }}
                    formatter={(value) => [`£${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#0d9488" 
                    strokeWidth={2}
                    fill="url(#revenueGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </DashboardCard>
          </div>
        </div>

      </div>
    </div>
  );
}
