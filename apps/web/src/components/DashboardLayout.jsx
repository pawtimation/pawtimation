import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { isMobile } from '../lib/isMobile';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function DashboardLayout({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render DashboardLayout for mobile admin routes - they use AdminMobileLayout
  if (location.pathname.startsWith('/admin/m/')) {
    return null;
  }

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
    { key: 'requests', label: 'Pending Requests', to: '/admin/requests' },
    { key: 'messages', label: 'Messages', to: '/admin/messages' },
    { key: 'clients', label: 'Clients', to: '/admin/clients' },
    { key: 'services', label: 'Services', to: '/admin/services' },
    { key: 'bookings', label: 'Bookings', to: '/admin/bookings' },
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

  // Auto-redirect admin users to mobile interface on phones
  // Only redirect from desktop admin routes, not from mobile routes
  useEffect(() => {
    const isDesktopAdminRoute = (
      location.pathname === '/' ||
      (location.pathname.startsWith('/admin') && !location.pathname.startsWith('/admin/m/'))
    );
    
    if (isAdmin && isMobile() && isDesktopAdminRoute) {
      navigate('/admin/m/dashboard', { replace: true });
    }
  }, [isAdmin, location.pathname, navigate]);

  async function handleLogout() {
    try {
      // Call backend logout to clear cookie
      await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:8787'}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    
    // Clear all local data
    localStorage.clear();
    sessionStorage.clear();
    
    // Force redirect to login
    window.location.replace('/client/login');
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex w-64 bg-white border-r flex-col">
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

        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.to === '/admin' 
              ? location.pathname === '/admin'
              : location.pathname.startsWith(item.to);
            
            return (
              <NavLink
                key={item.key}
                to={item.to}
                className={classNames(
                  'sidebar-link flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors block',
                  isActive
                    ? 'bg-teal-100 text-teal-800 font-semibold'
                    : 'text-slate-700 hover:bg-gray-100'
                )}
              >
                <span>{item.label}</span>
              </NavLink>
            );
          })}
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
