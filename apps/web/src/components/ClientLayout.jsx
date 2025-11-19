import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { repo } from '../../../api/src/repo.js';

export function ClientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('Your Walker');

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        const businessId = parsed.businessId;
        
        if (businessId) {
          const business = await repo.getBusiness(businessId);
          if (business) {
            setBusinessName(business.name);
          }
        }
      } catch (err) {
        console.error('Failed to load business name:', err);
      }
    })();
  }, []);

  function handleLogout() {
    localStorage.removeItem('pt_client');
    localStorage.removeItem('pt_user');
    localStorage.removeItem('pt_token');
    navigate('/client/login');
  }

  const navItems = [
    { path: '/client/dashboard', label: 'Dashboard' },
    { path: '/client/dogs', label: 'My Dogs' },
    { path: '/client/bookings', label: 'Bookings' },
    { path: '/client/invoices', label: 'Invoices' },
    { path: '/client/profile', label: 'Profile' },
    { path: '/client/support', label: 'Support' }
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-slate-200 p-4 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            {businessName}
          </h2>
          <p className="text-xs text-slate-500">Powered by Pawtimation</p>
        </div>

        <nav className="space-y-1">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`block px-2 py-1 rounded text-sm ${
                  active
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-slate-200">
          <button
            onClick={handleLogout}
            className="block w-full px-2 py-1 rounded text-sm text-left text-slate-700 hover:bg-slate-100"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
