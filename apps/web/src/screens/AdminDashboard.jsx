import React from "react";
import DashboardCard from "../components/layout/DashboardCard";

export function AdminDashboard() {
  const staffCount = 1;
  const clientsCount = 0;
  const dogsCount = 0;
  const jobsCount = 0;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="px-10 py-12 space-y-12">
        
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Business Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <DashboardCard>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Staff</p>
                <p className="text-3xl font-semibold text-gray-900">{staffCount}</p>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Clients</p>
                <p className="text-3xl font-semibold text-gray-900">{clientsCount}</p>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Dogs</p>
                <p className="text-3xl font-semibold text-gray-900">{dogsCount}</p>
              </div>
            </DashboardCard>

            <DashboardCard>
              <div className="space-y-1">
                <p className="text-sm text-gray-500">Jobs</p>
                <p className="text-3xl font-semibold text-gray-900">{jobsCount}</p>
              </div>
            </DashboardCard>
          </div>
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
