import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { staffApi } from '../lib/auth';
import { Paw } from '../ui/Paw';

export function StaffMobileLayout({ children }) {
  const location = useLocation();
  const [branding, setBranding] = useState({});
  const [loadingBranding, setLoadingBranding] = useState(true);

  useEffect(() => {
    loadBranding();
  }, []);

  async function loadBranding() {
    try {
      const response = await staffApi('/business/branding');
      if (response.ok) {
        const data = await response.json();
        setBranding(data.branding || {});
      } else {
        console.warn('Failed to load branding, using defaults:', response.status);
        setBranding({});
      }
    } catch (err) {
      console.error('Failed to load branding, using defaults:', err);
      setBranding({});
    } finally {
      setLoadingBranding(false);
    }
  }

  const brandColor = branding?.primaryColor || '#3F9C9B';
  
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const rgb = hexToRgb(brandColor);

  const navItems = [
    { 
      to: '/staff', 
      label: 'Today',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      to: '/staff/calendar', 
      label: 'Calendar',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      to: '/staff/messages', 
      label: 'Messages',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      )
    },
    { 
      to: '/staff/settings', 
      label: 'Settings',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="flex flex-col min-h-screen">
        {!loadingBranding && (
          <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <Paw className="w-10 h-10" />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pawtimation</h2>
                {branding.businessName && (
                  <h1 className="text-base font-bold text-slate-900">
                    {branding.businessName}
                  </h1>
                )}
                <p className="text-xs text-slate-500">Staff Portal</p>
              </div>
            </div>
          </header>
        )}

        <main className="flex-1 px-6 pt-6 pb-32" style={{ 
          paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' 
        }}>
          {children}
        </main>
      </div>

      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-2xl border-t border-slate-200/50"
        style={{ 
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.08), 0 -2px 8px rgba(0, 0, 0, 0.04)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="flex items-center justify-around px-4 py-3">
          {navItems.map(item => {
            const isActive = item.to === '/staff' 
              ? location.pathname === '/staff'
              : location.pathname.startsWith(item.to);

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className="flex flex-col items-center justify-center gap-1 rounded-2xl transition-all duration-300 active:scale-95"
                style={{
                  minWidth: '72px',
                  minHeight: '64px',
                  padding: '10px 12px',
                  color: isActive ? brandColor : '#64748b',
                  backgroundColor: isActive 
                    ? rgb ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.12)` : `${brandColor}15`
                    : 'transparent',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)'
                }}
              >
                <div style={{ 
                  filter: isActive ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' : 'none',
                  transition: 'filter 0.3s ease'
                }}>
                  {item.icon}
                </div>
                <span className="text-xs font-semibold" style={{ 
                  marginTop: '2px',
                  letterSpacing: '-0.01em'
                }}>
                  {item.label}
                </span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
