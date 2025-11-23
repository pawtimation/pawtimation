import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarWeekGrid } from "../../components/calendar/CalendarWeekGrid";
import { getWeekDates, groupBookingsByDay } from "../../utils/calendar";
import { adminApi } from '../../lib/auth';

export function StaffDetail() {
  const { staffId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const tabFromUrl = searchParams.get('tab') || 'overview';
  const [tab, setTab] = useState(tabFromUrl);
  const [staff, setStaff] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [services, setServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [saving, setSaving] = useState(false);
  
  const weekDates = getWeekDates(new Date());

  useEffect(() => {
    if (tabFromUrl !== tab) {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    loadData();
  }, [staffId]);

  async function loadData() {
    try {
      setLoading(true);
      
      const [staffResponse, bookingsResponse, servicesResponse] = await Promise.all([
        adminApi(`/staff/${staffId}`),
        adminApi(`/bookings/list?staffId=${staffId}`),
        adminApi('/services/list')
      ]);
      
      const staffData = await staffResponse.json();
      setStaff(staffData);

      const staffBookings = await bookingsResponse.json();
      setJobs(staffBookings);

      const allServices = await servicesResponse.json();
      const servicesList = Array.isArray(allServices) ? allServices : allServices.services || [];
      setAvailableServices(servicesList);
      
      const staffServices = staffData.services || [];
      const normalizedServices = normalizeServiceIds(staffServices, servicesList);
      setServices(normalizedServices);
    } catch (error) {
      console.error('Failed to load staff details:', error);
    } finally {
      setLoading(false);
    }
  }

  function normalizeServiceIds(staffServices, availableServices) {
    if (!Array.isArray(staffServices) || staffServices.length === 0) {
      return [];
    }

    const validServiceIds = new Set();
    const unmatchedItems = [];
    
    for (const item of staffServices) {
      if (!item) continue;
      
      const itemStr = typeof item === 'object' ? item.id || item.name : String(item);
      if (!itemStr) continue;
      
      const matchingService = availableServices.find(s => {
        if (s.id === itemStr) return true;
        if (s.name && s.name.toLowerCase() === itemStr.toLowerCase()) return true;
        return false;
      });
      
      if (matchingService) {
        validServiceIds.add(matchingService.id);
      } else {
        unmatchedItems.push(itemStr);
      }
    }
    
    if (unmatchedItems.length > 0) {
      console.warn('Staff has services that could not be matched:', unmatchedItems);
    }
    
    return Array.from(validServiceIds);
  }

  function changeTab(newTab) {
    setTab(newTab);
    setSearchParams({ tab: newTab });
  }

  function onBookingMoved(updatedBooking) {
    setJobs(prev => prev.map(b => 
      b.id === updatedBooking.id ? updatedBooking : b
    ));
  }

  function onSelectBooking(booking) {
    setSelectedBooking(booking);
  }

  function closeBookingDetail() {
    setSelectedBooking(null);
  }

  async function handleSaveServices() {
    if (!services) return;
    
    try {
      setSaving(true);
      const res = await adminApi(`/staff/${staffId}/services`, {
        method: 'POST',
        body: JSON.stringify({ services })
      });

      if (res.ok) {
        alert('Services updated successfully');
        await loadData();
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage = errorData.error || 'Failed to update services';
        console.error('Service save failed:', errorMessage);
        alert(`Failed to update services: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Failed to save services:', error);
      alert(`Error updating services: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  }

  function toggleService(serviceId) {
    setServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  }

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">Loading staff...</p>
      </div>
    );
  }
  
  if (!staff) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">Staff member not found</p>
      </div>
    );
  }

  const last7DaysJobs = jobs.filter(job => {
    const jobDate = new Date(job.start);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return jobDate >= weekAgo;
  });

  return (
    <div className="space-y-6">
      <div>
        <button
          className="text-teal-600 text-sm mb-3 hover:underline flex items-center gap-1"
          onClick={() => navigate("/admin/staff")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Staff
        </button>

        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-slate-900">{staff.name}</h1>
          <span className="text-sm text-slate-600">
            {staff.role || 'Staff'} · <span className={staff.active !== false ? 'text-emerald-600' : 'text-slate-500'}>
              {staff.active !== false ? 'Active' : 'Inactive'}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex gap-6">
          {['overview', 'jobs', 'calendar'].map(t => (
            <button
              key={t}
              onClick={() => changeTab(t)}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors capitalize ${
                tab === t
                  ? 'border-teal-600 text-teal-600'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Contact Details - Full Width */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-900">Contact Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Email</label>
                <p className="mt-1 text-sm text-slate-900">{staff.email || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                <p className="mt-1 text-sm text-slate-900">{staff.phone || 'Not provided'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
                <p className="mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    staff.active !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {staff.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Role</label>
                <p className="mt-1 text-sm text-slate-900">{staff.role || 'STAFF'}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Joined</label>
                <p className="mt-1 text-sm text-slate-900">
                  {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  }) : 'Unknown'}
                </p>
              </div>
            </div>
          </div>

          {/* Two Column Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assigned Services */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">Assigned Services</h2>
              {services && services.length > 0 ? (
                <ul className="space-y-2">
                  {services.map(serviceId => {
                    const service = availableServices.find(s => s.id === serviceId);
                    return (
                      <li key={serviceId} className="flex items-center text-sm text-slate-700">
                        <svg className="w-4 h-4 text-teal-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {service?.name || serviceId}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No services assigned yet.</p>
              )}
            </div>

            {/* Performance Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">Performance Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Last 7 days</span>
                  <span className="text-2xl font-bold text-slate-900">{last7DaysJobs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Total jobs</span>
                  <span className="text-lg font-semibold text-slate-700">{jobs.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Conflicts</span>
                  <span className="text-lg font-semibold text-slate-700">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "jobs" && (
        <div>
          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-600">No jobs assigned yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map(job => (
                <div
                  key={job.id}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{job.serviceName || 'Service'}</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Client: {job.clientName || 'Unknown'}
                      </p>
                      <p className="text-sm text-slate-500 mt-1">
                        {new Date(job.start).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        job.status === 'BOOKED' ? 'bg-teal-100 text-teal-800 border-teal-200' :
                        job.status === 'PENDING' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        job.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
                        job.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                        'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {job.status}
                      </span>
                      <button
                        className="text-xs text-teal-600 hover:text-teal-700 hover:underline"
                        onClick={() => navigate(`/admin/bookings`)}
                      >
                        View booking →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "calendar" && (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-1">
              Weekly Calendar for {staff.name}
            </h2>
            <p className="text-sm text-slate-600">Shows assigned jobs only.</p>
          </div>

          {jobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
              <p className="text-slate-600">No jobs scheduled.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <CalendarWeekGrid
                weekDates={weekDates}
                bookingsMap={groupBookingsByDay(jobs)}
                onSelectBooking={onSelectBooking}
                onBookingMoved={onBookingMoved}
              />
              <div className="text-xs text-slate-500 mt-4">
                Drag bookings to reschedule or click to view details.
              </div>
            </div>
          )}

          {selectedBooking && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold">Booking Details</h3>
                  <button 
                    onClick={closeBookingDetail}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-slate-700">Service</label>
                    <p className="text-slate-900">{selectedBooking.serviceName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Client</label>
                    <p className="text-slate-900">{selectedBooking.clientName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Start Time</label>
                    <p className="text-slate-900">
                      {new Date(selectedBooking.start).toLocaleString('en-GB', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-slate-700">Status</label>
                    <p>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        selectedBooking.status === 'BOOKED' ? 'bg-teal-100 text-teal-800' :
                        selectedBooking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        selectedBooking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                        selectedBooking.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {selectedBooking.status}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-2">
                  <button 
                    onClick={() => {
                      closeBookingDetail();
                      navigate(`/admin/bookings`);
                    }}
                    className="btn btn-primary flex-1"
                  >
                    View All Bookings
                  </button>
                  <button 
                    onClick={closeBookingDetail}
                    className="btn btn-secondary flex-1"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
