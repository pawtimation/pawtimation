import React, { useEffect, useState } from "react";
import DashboardCard from "../components/layout/DashboardCard";
import { api } from "../lib/auth";
import { useDataRefresh } from "../contexts/DataRefreshContext";

export function AdminDashboard() {
  const [stats, setStats] = useState({
    upcomingJobs: 0,
    pendingRequests: 0,
    activeClients: 0,
    revenueWeek: 0
  });
  const [loading, setLoading] = useState(true);
  const { registerRefreshHandler } = useDataRefresh();

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

  useEffect(() => {
    loadStats();
  }, []);

  // Refresh stats when bookings, invoices, or stats change
  useEffect(() => {
    const unsubscribe = registerRefreshHandler(['bookings', 'invoices', 'stats'], loadStats);
    return unsubscribe;
  }, [registerRefreshHandler]);

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
              <div className="h-40 w-full bg-[url('/dashboard-placeholders/jobs-over-time.svg')] bg-center bg-cover rounded-lg"></div>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Service breakdown</h3>
              <div className="h-40 w-full bg-[url('/dashboard-placeholders/service-breakdown.svg')] bg-center bg-cover rounded-lg"></div>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Staff workload</h3>
              <div className="h-40 w-full bg-[url('/dashboard-placeholders/staff-workload.svg')] bg-center bg-cover rounded-lg"></div>
            </DashboardCard>

            <DashboardCard>
              <h3 className="text-md font-medium text-gray-700 mb-3">Revenue forecast</h3>
              <div className="h-40 w-full bg-[url('/dashboard-placeholders/revenue-forecast.svg')] bg-center bg-cover rounded-lg"></div>
            </DashboardCard>
          </div>
        </div>

      </div>
    </div>
  );
}
