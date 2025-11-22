import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../lib/auth';

export function AdminStaffServices({ business }) {
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStaff();
  }, [business]);

  const loadStaff = async () => {
    if (!business?.id) return;
    try {
      const res = await adminApi(`/users/by-business/${business.id}`);
      const users = await res.json();
      const staffList = users.filter(u => u.role === 'STAFF');
      setStaff(staffList);
    } catch (e) {
      console.error('Failed to load staff:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-slate-600">Loading staff...</div>;
  }

  if (staff.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-slate-600 mb-4">No staff members yet.</p>
        <p className="text-sm text-slate-500">Add staff members in the Team tab first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 mb-4">
        Click on a staff member to assign service qualifications and skills.
      </div>
      
      <div className="grid gap-3">
        {staff.map(s => (
          <div
            key={s.id}
            className="card cursor-pointer hover:bg-slate-50 transition-colors"
            onClick={() => navigate(`/admin/staff/${s.id}`)}
          >
            <div className="flex justify-between items-center">
              <div>
                <div className="font-semibold text-sm">{s.name}</div>
                <div className="text-xs text-slate-500">{s.email || 'No email'}</div>
              </div>
              <div className="text-xs text-teal-600">
                Manage services →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
