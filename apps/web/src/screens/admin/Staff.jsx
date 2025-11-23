import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/auth';
import { AdminStaffAvailability } from '../AdminStaffAvailability';
import { AdminStaffServices } from '../AdminStaffServices';

function StaffTeam({ business }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);
  const [jobStats, setJobStats] = useState({});

  useEffect(() => {
    loadStaff();
    loadJobStats();
  }, []);

  async function loadStaff() {
    try {
      setLoading(true);
      const res = await adminApi(`/staff/list`);
      if (res.ok) {
        const staffList = await res.json();
        setStaff(staffList);
      } else {
        console.error('Failed to load staff');
        setStaff([]);
      }
    } catch (err) {
      console.error('Failed to load staff:', err);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadJobStats() {
    try {
      const res = await adminApi('/bookings/list');
      if (res.ok) {
        const bookings = await res.json();
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        
        const stats = {};
        bookings.forEach(booking => {
          if (booking.staffId) {
            if (!stats[booking.staffId]) {
              stats[booking.staffId] = 0;
            }
            const bookingDate = new Date(booking.start);
            if (bookingDate >= weekAgo && bookingDate <= now) {
              stats[booking.staffId]++;
            }
          }
        });
        setJobStats(stats);
      }
    } catch (err) {
      console.error('Failed to load job stats:', err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    try {
      const res = await adminApi('/users/create', {
        method: 'POST',
        body: {
          role: 'STAFF',
          name: form.name,
          email: form.email
        }
      });

      if (res.ok) {
        await loadStaff();
        setForm({ name: '', email: '' });
        setShowAddModal(false);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create staff member');
      }
    } catch (err) {
      console.error('Failed to create staff:', err);
      alert('Failed to create staff member');
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <p className="text-sm text-slate-600">Loading staff...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          className="btn btn-primary text-sm"
          onClick={() => setShowAddModal(true)}
        >
          + Add Staff Member
        </button>
      </div>

      {staff.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <p className="text-slate-600 mb-2">No staff members yet.</p>
          <p className="text-sm text-slate-500">Add your first team member to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map(s => (
            <div 
              key={s.id} 
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 text-base">{s.name}</h3>
                  <p className="text-sm text-slate-600 mt-0.5">{s.email || 'No email'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        const res = await adminApi(`/staff/${s.id}/resend-invite`, { method: 'POST' });
                        if (res.ok) {
                          alert('Invite email resent successfully!');
                        } else {
                          alert('Failed to resend invite');
                        }
                      } catch (err) {
                        alert('Failed to resend invite');
                      }
                    }}
                    className="text-xs text-teal-600 hover:text-teal-700 underline"
                    title="Resend staff invite email"
                  >
                    Resend Invite
                  </button>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    s.active !== false ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}>
                    {s.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-700">
                    {s.serviceCount || s.services?.length || 0} service{(s.serviceCount || s.services?.length || 0) === 1 ? '' : 's'} assigned
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <svg className="w-4 h-4 text-slate-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-slate-700">
                    {jobStats[s.id] || 0} job{(jobStats[s.id] || 0) === 1 ? '' : 's'} this week
                  </span>
                </div>
              </div>

              <button
                className="w-full text-center text-sm text-teal-700 hover:text-teal-900 font-medium hover:underline"
                onClick={() => navigate(`/admin/staff/${s.id}`)}
              >
                View staff member →
              </button>
            </div>
          ))}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Add Staff Member</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="Enter staff name"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="email@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
                <p className="text-xs text-slate-500 mt-1">Staff members need an email address to receive their login credentials</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg hover:bg-slate-50"
                  onClick={() => {
                    setShowAddModal(false);
                    setForm({ name: '', email: '' });
                  }}
                >
                  Cancel
                </button>
                <button className="flex-1 btn btn-primary text-sm" type="submit">
                  Add Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export function Staff({ business }) {
  const [activeTab, setActiveTab] = useState('team');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold text-slate-900">Staff</h1>
        <p className="text-sm text-slate-600">
          Manage your team, availability and service skills.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200 sticky top-0 bg-white z-10">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab('team')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'team'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Team
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'availability'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Availability
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'skills'
                ? 'border-teal-600 text-teal-600'
                : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-slate-300'
            }`}
          >
            Service Skills
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'team' && <StaffTeam business={business} />}
        {activeTab === 'availability' && <AdminStaffAvailability business={business} />}
        {activeTab === 'skills' && <AdminStaffServices business={business} />}
      </div>
    </div>
  );
}
