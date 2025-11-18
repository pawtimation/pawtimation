import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function DashboardLayout({ user, children }) {
  const navigate = useNavigate();

  const role =
    user?.role ||
    (user?.isAdmin ? 'admin' : 'staff');

  const isAdmin = role === 'ADMIN' || role === 'admin';

  const navItems = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      to: '/admin',
      roles: ['admin', 'staff']
    },
    {
      key: 'clients',
      label: 'Clients',
      to: '/admin/clients',
      roles: ['admin', 'staff']
    },
    {
      key: 'calendar',
      label: 'Calendar',
      to: '/admin/calendar',
      roles: ['admin', 'staff']
    },
    {
      key: 'jobs',
      label: 'Jobs',
      to: '/admin/jobs',
      roles: ['admin', 'staff']
    },
    {
      key: 'invoices',
      label: 'Invoicing',
      to: '/admin/invoices',
      roles: ['admin']
    },
    {
      key: 'staff',
      label: 'Staff',
      to: '/admin/staff',
      roles: ['admin']
    },
    {
      key: 'dogs',
      label: 'Dogs',
      to: '/admin/dogs',
      roles: ['admin', 'staff']
    },
    {
      key: 'services',
      label: 'Services',
      to: '/admin/services',
      roles: ['admin']
    }
  ];

  const lowerItems = [
    {
      key: 'requests',
      label: 'Requests',
      to: '/admin/requests',
      roles: ['admin', 'staff']
    }
  ];

  const visibleNav = navItems.filter(item =>
    item.roles.includes(isAdmin ? 'admin' : 'staff')
  );
  const visibleLower = lowerItems.filter(item =>
    item.roles.includes(isAdmin ? 'admin' : 'staff')
  );

  const businessName = 'Demo Dog Walking';
  const userName = user?.name || user?.email || 'User';

  function handleLogout() {
    localStorage.removeItem('pt_user');
    localStorage.removeItem('pt_token');
    localStorage.removeItem('pt_masquerade');
    navigate('/');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-60 bg-white border-r flex flex-col">
        <div className="px-4 py-4 border-b">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Pawtimation CRM
          </div>
          <div className="mt-1 font-semibold text-sm text-slate-900 truncate">
            {businessName}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAdmin ? 'Admin' : 'Staff'}
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
          {visibleNav.map(item => (
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

          {visibleLower.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-1">
              {visibleLower.map(item => (
                <NavLink
                  key={item.key}
                  to={item.to}
                  className={({ isActive }) =>
                    classNames(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors',
                      isActive
                        ? 'bg-teal-100 text-teal-700'
                        : 'text-slate-600 hover:bg-teal-50'
                    )
                  }
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </nav>

        <div className="border-t px-3 py-3 text-xs flex items-center justify-between">
          <div>
            <div className="font-medium text-slate-800 truncate max-w-[9rem]">
              {userName}
            </div>
            <div className="text-[11px] text-slate-500">
              {isAdmin ? 'Admin' : 'Staff'}
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

      <main className="flex-1 flex flex-col">
        <div className="px-6 py-4">
          {children}
        </div>
      </main>
    </div>
  );
}
