import React, { useState, useEffect } from 'react';
import { ownerApi } from '../lib/auth';
import { SuperAdminGuard } from '../components/SuperAdminGuard';

export function OwnerErrorHeatmap() {
  return (
    <SuperAdminGuard>
      <ErrorHeatmapContent />
    </SuperAdminGuard>
  );
}

function ErrorHeatmapContent() {
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [daysAgo, setDaysAgo] = useState(7);
  const [selectedTab, setSelectedTab] = useState('overview');

  async function loadHeatmap() {
    try {
      setLoading(true);
      setError(null);
      const response = await ownerApi(`/owner/errors/heatmap?daysAgo=${daysAgo}`);
      
      if (!response.ok) {
        throw new Error('Failed to load error heatmap');
      }
      
      const data = await response.json();
      setHeatmap(data);
    } catch (err) {
      console.error('Error loading heatmap:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHeatmap();
  }, [daysAgo]);

  if (loading && !heatmap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gray-300 border-t-blue-600 rounded-full mx-auto mb-3"></div>
          <p className="text-gray-600">Loading error heatmap...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={loadHeatmap}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!heatmap) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'errors', label: 'Top Errors' },
    { id: 'endpoints', label: 'By Endpoint' },
    { id: 'businesses', label: 'By Business' },
    { id: 'roles', label: 'By Role' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Error Heatmap</h1>
            <p className="mt-1 text-sm text-gray-600">
              Platform-wide error tracking and monitoring
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Period:</label>
            <select
              value={daysAgo}
              onChange={(e) => setDaysAgo(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>Last 24 hours</option>
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            
            <button
              onClick={loadHeatmap}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {heatmap.summary.totalErrors || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Total Errors</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900">
                {heatmap.summary.uniqueErrors || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Unique Errors</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">
                {heatmap.byBusiness?.length || 0}
              </div>
              <div className="text-sm text-gray-600 mt-1">Affected Businesses</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-700">
                {heatmap.summary.period}
              </div>
              <div className="text-sm text-gray-600 mt-1">Period</div>
            </div>
          </div>
        </div>

        <div className="mb-4 border-b border-gray-200">
          <nav className="flex gap-4">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {selectedTab === 'overview' && (
          <div className="space-y-6">
            <SummaryCard title="Most Frequent Errors" data={heatmap.topErrors?.slice(0, 5)} />
            <SummaryCard title="Most Affected Endpoints" data={heatmap.byEndpoint?.slice(0, 5)} />
          </div>
        )}

        {selectedTab === 'errors' && (
          <ErrorsTable errors={heatmap.topErrors || []} />
        )}

        {selectedTab === 'endpoints' && (
          <EndpointsTable endpoints={heatmap.byEndpoint || []} />
        )}

        {selectedTab === 'businesses' && (
          <BusinessesTable businesses={heatmap.byBusiness || []} />
        )}

        {selectedTab === 'roles' && (
          <RolesTable roles={heatmap.byUserRole || []} />
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, data }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-gray-600 text-center py-8">No data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {item.endpoint || item.errorMessage || 'Unknown'}
              </div>
              {item.method && (
                <div className="text-xs text-gray-500 mt-1">
                  <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">{item.method}</span>
                </div>
              )}
            </div>
            <div className="ml-4 flex items-center gap-3">
              <span className="text-sm font-semibold text-red-600">
                {item.occurrences || item.count} errors
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorsTable({ errors }) {
  if (errors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No errors recorded in this period</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Endpoint
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Error Message
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Count
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Seen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {errors.map((error) => (
            <tr key={error.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {error.method}
                  </span>
                  <span className="text-sm text-gray-900 font-medium truncate max-w-xs">
                    {error.endpoint}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-md truncate">
                  {error.errorMessage}
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {error.occurrences}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {new Date(error.lastOccurred).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EndpointsTable({ endpoints }) {
  if (endpoints.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No endpoint errors recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Endpoint
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Errors
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unique Errors
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {endpoints.map((endpoint, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                    {endpoint.method}
                  </span>
                  <span className="text-sm text-gray-900 font-medium">
                    {endpoint.endpoint}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {endpoint.count}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {endpoint.uniqueErrors}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BusinessesTable({ businesses }) {
  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No business-specific errors recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Business
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Errors
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unique Errors
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {businesses.map((business, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm font-medium text-gray-900">
                {business.businessName || business.businessId}
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {business.count}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {business.uniqueErrors}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RolesTable({ roles }) {
  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No role-specific errors recorded</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              User Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total Errors
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unique Errors
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {roles.map((role, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {role.userRole}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {role.count}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-600">
                {role.uniqueErrors}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
