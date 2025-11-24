import React, { useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { isMobile } from '../lib/isMobile';
import { clearSession, getSession } from '../lib/auth';

function classNames(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function DashboardLayout({ user, children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

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
  
  const [logoUrl, setLogoUrl] = React.useState(user?.business?.settings?.branding?.logoUrl);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Listen for branding updates
  React.useEffect(() => {
    function handleBrandingUpdate(event) {
      // event.detail is the branding object itself, not wrapped
      // Treat explicit empty string as intentional logo removal (don't fall back to localStorage)
      if (event.detail && 'logoUrl' in event.detail) {
        setLogoUrl(event.detail.logoUrl || '');
      }
    }
    
    window.addEventListener('brandingUpdated', handleBrandingUpdate);
    return () => window.removeEventListener('brandingUpdated', handleBrandingUpdate);
  }, []);

  const adminNav = [
    { key: 'dashboard', label: 'Dashboard', to: '/admin' },
    { key: 'messages', label: 'Messages', to: '/admin/messages' },
    { key: 'clients', label: 'Clients', to: '/admin/clients' },
    { key: 'services', label: 'Services', to: '/admin/services' },
    { key: 'bookings', label: 'Bookings', to: '/admin/bookings' },
    { key: 'calendar', label: 'Calendar', to: '/admin/calendar' },
    { key: 'finance', label: 'Finance', to: '/admin/invoices' },
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

  // NEW BEHAVIOUR: No automatic redirection
  // Desktop UI can be viewed on any device
  // Mobile UI is only shown if the user manually visits /admin/m/... routes
  // /admin/... → Desktop UI
  // /admin/m/... → Mobile UI

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
    
    // Clear only the role-specific session
    if (isAdmin) {
      clearSession('ADMIN');
      window.location.replace('/admin/login');
    } else if (isStaff) {
      clearSession('STAFF');
      window.location.replace('/staff/login');
    } else {
      clearSession('ADMIN');
      window.location.replace('/admin/login');
    }
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-white border-r flex-col
        transform transition-transform duration-300 ease-in-out
        md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0 flex' : '-translate-x-full md:flex'}
      `}>
        <div className="px-4 py-4 border-b">
          <div className="flex items-center gap-2 mb-2">
            <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-6 h-6" />
            <div className="text-xs uppercase tracking-wide text-slate-500">
              Pawtimation
            </div>
          </div>
          <div className="font-semibold text-sm text-slate-900 truncate">
            {businessName}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {isAdmin ? 'Admin' : isStaff ? 'Staff' : 'User'}
          </div>
        </div>

        <nav className="flex-1 px-2 py-6 overflow-y-auto space-y-2">
          {navItems.map(item => {
            // For root paths (dashboard), check exact match
            // For other paths, check if current path starts with item path
            const isActive = (item.to === '/admin' || item.to === '/staff' || item.to === '/staff/dashboard')
              ? (location.pathname === item.to || location.pathname === '/staff/dashboard' && item.to === '/staff')
              : location.pathname.startsWith(item.to);
            
            return (
              <NavLink
                key={item.key}
                to={item.to}
                onClick={() => setMobileMenuOpen(false)}
                className={classNames(
                  'sidebar-link flex items-center gap-2 px-3 py-3 rounded-md text-sm font-medium transition-colors block',
                  isActive
                    ? 'font-semibold'
                    : 'text-slate-700 hover:bg-gray-100'
                )}
                style={isActive ? {
                  backgroundColor: '#A8E6CF',
                  color: '#3F9C9B'
                } : {}}
              >
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Business Logo Display */}
        {logoUrl && (
          <div className="border-t px-4 py-4">
            <img 
              src={logoUrl} 
              alt={`${businessName} logo`}
              className="w-24 h-24 object-contain mx-auto"
            />
          </div>
        )}

        {/* OPTIONAL UI SWITCHER - visible on small screens */}
        {isAdmin && (
          <div className="border-t px-3 py-2 md:hidden">
            <a 
              href="/admin/m/dashboard"
              className="text-xs font-medium block py-1 hover:opacity-80"
              style={{color: '#3F9C9B'}}
            >
              → Switch to Mobile UI
            </a>
          </div>
        )}

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
            className="text-[11px] text-brand-teal hover:opacity-80"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-5 h-5" />
            <span className="font-semibold text-sm text-slate-900 truncate max-w-[200px]">
              {businessName}
            </span>
          </div>
          <div className="w-6"></div>
        </div>
        
        <div className="flex-1 px-4 md:px-8 py-4 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
