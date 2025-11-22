import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSession, ownerApi } from '../lib/auth';

export function OwnerLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [filters, setFilters] = useState({
    businessId: '',
    logType: '',
    severity: '',
    userId: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({ limit: 50, offset: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession('SUPER_ADMIN');
    if (!session || !session.isSuperAdmin) {
      navigate('/owner/login');
      return;
    }
    loadLogs();
  }, [pagination.offset, filters]);

  async function loadLogs() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...(filters.businessId && { businessId: filters.businessId }),
        ...(filters.logType && { logType: filters.logType }),
        ...(filters.severity && { severity: filters.severity }),
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.search && { search: filters.search })
      });

      const res = await ownerApi(`/owner/logs?${params}`);
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          navigate('/owner/login');
          return;
        }
        throw new Error('Failed to load logs');
      }

      const data = await res.json();
      const fetchedLogs = data.logs || [];
      setLogs(fetchedLogs);
      
      // Use backend-provided hasMore for accurate pagination control
      setHasMore(data.pagination?.hasMore ?? false);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  }

  function nextPage() {
    setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }));
  }

  function prevPage() {
    setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }));
  }

  function clearFilters() {
    setFilters({
      businessId: '',
      logType: '',
      severity: '',
      userId: '',
      startDate: '',
      endDate: '',
      search: ''
    });
    setPagination({ limit: 50, offset: 0 });
    setHasMore(true);
  }

  const severityColors = {
    INFO: 'bg-blue-50 text-blue-700 border-blue-200',
    WARN: 'bg-amber-50 text-amber-700 border-amber-200',
    ERROR: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">System Logs</h1>
              <p className="text-sm text-slate-600 mt-1">Platform-wide audit trail</p>
            </div>
            <button
              onClick={() => navigate('/owner')}
              className="btn btn-secondary text-sm"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Search
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                placeholder="Search message or metadata..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Log Type
              </label>
              <select
                className="input w-full text-sm"
                value={filters.logType}
                onChange={(e) => updateFilter('logType', e.target.value)}
              >
                <option value="">All Types</option>
                <option value="AUTH">Authentication</option>
                <option value="ADMIN_ACTION">Admin Action</option>
                <option value="PAYMENT">Payment</option>
                <option value="TRIAL">Trial</option>
                <option value="BETA">Beta</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Severity
              </label>
              <select
                className="input w-full text-sm"
                value={filters.severity}
                onChange={(e) => updateFilter('severity', e.target.value)}
              >
                <option value="">All Severities</option>
                <option value="INFO">Info</option>
                <option value="WARN">Warning</option>
                <option value="ERROR">Error</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Business ID
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                placeholder="Filter by business..."
                value={filters.businessId}
                onChange={(e) => updateFilter('businessId', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                User ID
              </label>
              <input
                type="text"
                className="input w-full text-sm"
                placeholder="Filter by user..."
                value={filters.userId}
                onChange={(e) => updateFilter('userId', e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700 block mb-1">
                Date Range
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  className="input w-full text-sm"
                  value={filters.startDate}
                  onChange={(e) => updateFilter('startDate', e.target.value)}
                />
                <input
                  type="date"
                  className="input w-full text-sm"
                  value={filters.endDate}
                  onChange={(e) => updateFilter('endDate', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600">
              Showing {logs.length} log{logs.length !== 1 ? 's' : ''}
              {pagination.offset > 0 && ` (offset: ${pagination.offset})`}
            </p>
            <button
              onClick={clearFilters}
              className="btn btn-sm btn-ghost text-xs"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        {loading ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading logs...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
            <p className="text-slate-600">No logs found</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Severity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-700 uppercase tracking-wider">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-900 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {log.logType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 border rounded text-xs font-medium ${severityColors[log.severity] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">
                        {log.message}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <details className="cursor-pointer">
                          <summary className="text-blue-600 hover:text-blue-700 text-xs font-medium">
                            View Details
                          </summary>
                          <div className="mt-2 p-2 bg-slate-50 rounded text-xs font-mono max-w-md overflow-auto">
                            {log.businessId && <div><strong>Business ID:</strong> {log.businessId}</div>}
                            {log.userId && <div><strong>User ID:</strong> {log.userId}</div>}
                            {log.metadata && (
                              <div className="mt-2">
                                <strong>Metadata:</strong>
                                <pre className="mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(log.metadata, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={prevPage}
                disabled={pagination.offset === 0}
                className="btn btn-sm btn-secondary disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {Math.floor(pagination.offset / pagination.limit) + 1}
              </span>
              <button
                onClick={nextPage}
                disabled={!hasMore}
                className="btn btn-sm btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
