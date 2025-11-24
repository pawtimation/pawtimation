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
  const hamburgerRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);
  const sidebarRef = React.useRef(null);

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

  const closeMobileMenu = React.useCallback(() => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      if (hamburgerRef.current) {
        hamburgerRef.current.focus();
      }
    }, 300);
  }, []);

  React.useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        }
      }, 100);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        closeMobileMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, closeMobileMenu]);

  React.useEffect(() => {
    if (!mobileMenuOpen || !sidebarRef.current) return;

    const sidebar = sidebarRef.current;
    const focusableElements = sidebar.querySelectorAll(
      'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    sidebar.addEventListener('keydown', handleTabKey);
    return () => sidebar.removeEventListener('keydown', handleTabKey);
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
          className="fixed inset-0 bg-black bg-opacity-40 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      <aside 
        id="mobile-sidebar"
        ref={sidebarRef}
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white md:border-r flex-col
          transform transition-all duration-300 ease-out
          md:translate-x-0 md:rounded-none md:shadow-none
          ${mobileMenuOpen ? 'translate-x-0 flex rounded-r-2xl shadow-2xl' : '-translate-x-full md:flex'}
        `}
        aria-label="Main navigation"
      >
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <img src="/pawtimation-paw.png" alt="Pawtimation" className="w-6 h-6" />
              <div className="text-xs uppercase tracking-wide text-slate-500">
                Pawtimation
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={closeMobileMenu}
              className="md:hidden p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 active:scale-95"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
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
                onClick={closeMobileMenu}
                className={classNames(
                  'sidebar-link flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 block',
                  isActive
                    ? 'font-semibold shadow-sm'
                    : 'text-slate-700 hover:bg-gray-50 active:scale-98'
                )}
                style={isActive ? {
                  backgroundColor: '#A8E6CF',
                  color: '#3F9C9B'
                } : {}}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Business Logo Display */}
        {logoUrl && (
          <div className="border-t border-gray-100 px-4 py-4">
            <img 
              src={logoUrl} 
              alt={`${businessName} logo`}
              className="w-24 h-24 object-contain mx-auto"
            />
          </div>
        )}

        {/* OPTIONAL UI SWITCHER - visible on small screens */}
        {isAdmin && (
          <div className="border-t border-gray-100 px-3 py-2 md:hidden">
            <a 
              href="/admin/m/dashboard"
              className="text-xs font-medium block py-1 hover:opacity-80 transition-opacity duration-200"
              style={{color: '#3F9C9B'}}
            >
              → Switch to Mobile UI
            </a>
          </div>
        )}

        <div className="border-t border-gray-100 px-3 py-3 text-xs flex items-center justify-between">
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
            className="text-[11px] text-brand-teal hover:opacity-80 transition-opacity duration-200"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <button
            ref={hamburgerRef}
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-all duration-200 active:scale-95"
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-sidebar"
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
