import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../../lib/auth';
import { AdminStaffAvailability } from '../AdminStaffAvailability';
import { AdminStaffServices } from '../AdminStaffServices';

function StaffTeam({ business }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      setLoading(true);
      // Use the staff list endpoint which uses authenticated user's business
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

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    try {
      const res = await adminApi('/users/create', {
        method: 'POST',
        body: JSON.stringify({
          role: 'STAFF',
          name: form.name,
          email: form.email
        })
      });

      if (res.ok) {
        await loadStaff();
        setForm({ name: '', email: '' });
      } else {
        alert('Failed to create staff member');
      }
    } catch (err) {
      console.error('Failed to create staff:', err);
      alert('Failed to create staff member');
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-600">Loading staff...</div>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="card space-y-3 max-w-md">
        <h2 className="font-semibold">Add staff member</h2>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Email (optional)"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <button className="btn btn-primary text-sm" type="submit">
          Save
        </button>
      </form>

      {staff.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-slate-600 mb-2">No staff members yet.</p>
          <p className="text-sm text-slate-500">Add your first team member above.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {staff.map(s => (
            <div 
              key={s.id} 
              className="card cursor-pointer hover:bg-slate-50 transition-colors"
              onClick={() => navigate(`/admin/staff/${s.id}`)}
            >
              <div className="font-semibold text-sm">{s.name}</div>
              <div className="text-xs text-slate-500">{s.email || 'No email'}</div>
              <div className="text-xs text-slate-400 mt-1">Click to view details →</div>
            </div>
          ))}
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
        <h1 className="text-xl font-semibold">Staff</h1>
        <p className="text-sm text-slate-600">
          Manage your team, availability schedules and service skills.
        </p>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-slate-200">
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
