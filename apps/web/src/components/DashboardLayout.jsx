import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function DashboardLayout({ user, children }) {
  const navigate = useNavigate();

  const role =
    user?.role ||
    (user?.isAdmin ? 'admin' : user?.isStaff ? 'staff' : 'admin');

  const normalizedRole = (role || 'admin').toLowerCase();
  const isAdmin = normalizedRole === 'admin';
  const isStaff = normalizedRole === 'staff';

  const businessName =
    user?.businessName ||
    user?.business?.name ||
    'Your business';

  const userName = user?.name || user?.email || 'User';

  const adminNav = [
    { key: 'dashboard', label: 'Dashboard', to: '/admin' },
    { key: 'clients', label: 'Clients', to: '/admin/clients' },
    { key: 'calendar', label: 'Calendar', to: '/admin/calendar' },
    { key: 'invoicing', label: 'Invoicing', to: '/admin/invoices' },
    { key: 'staff', label: 'Staff', to: '/admin/staff' },
    { key: 'settings', label: 'Settings', to: '/admin/settings' },
    { key: 'admin-panel', label: 'Admin Panel', to: '/admin/panel' }
  ];

  const staffNav = [
    { key: 'dashboard', label: 'Dashboard', to: '/staff' },
    { key: 'calendar', label: 'Calendar', to: '/staff/calendar' },
    { key: 'my-jobs', label: 'My Jobs', to: '/staff/jobs' },
    { key: 'availability', label: 'My Availability', to: '/staff/availability' },
    { key: 'settings', label: 'Settings', to: '/staff/settings' }
  ];

  const navItems = isAdmin ? adminNav : staffNav;

  function handleLogout() {
    localStorage.removeItem('pt_user');
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_masquerade');
    navigate('/');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-64 bg-white border-r flex flex-col">
        <div className="px-4 py-4 border-b">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Pawtimation
          </div>
          <div className="mt-1 font-semibold text-sm text-slate-900 truncate">
            {businessName}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'User'}
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {navItems.map(item => (
            <NavLink
              key={item.key}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-teal-100 text-teal-700'
                    : 'text-slate-700 hover:bg-teal-50'
                )
              }
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="border-t px-3 py-3 text-xs flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-800 truncate max-w-[9rem]">
              {userName}
            </div>
            <div className="text-[11px] text-slate-500">
              {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'User'}
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[11px] text-slate-500 hover:text-rose-600"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-8 py-6 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
