import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import * as businessApi from '../lib/businessApi';
import { loadNotifications } from '../lib/clientNotifications';
import { getInboxMessages } from '../lib/messagesApi';
import { clearSession } from '../lib/auth';

export function ClientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [businessName, setBusinessName] = useState('Your Walker');
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadInboxCount, setUnreadInboxCount] = useState(0);

  // Update unread count
  useEffect(() => {
    const updateUnreadCount = () => {
      const notifications = loadNotifications();
      const unread = notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    };
    
    // Update on route change
    updateUnreadCount();
    
    // Also update when notifications are read
    window.addEventListener('notificationsRead', updateUnreadCount);
    
    return () => {
      window.removeEventListener('notificationsRead', updateUnreadCount);
    };
  }, [location.pathname]); // Refresh when route changes

  // Update unread inbox messages count
  useEffect(() => {
    async function loadUnreadInbox() {
      try {
        const ptClient = localStorage.getItem('pt_client');
        const ptUser = localStorage.getItem('pt_user');
        
        if (ptClient && ptUser) {
          const clientData = JSON.parse(ptClient);
          const userData = JSON.parse(ptUser);
          const businessId = userData.businessId;
          const clientId = clientData.id;
          
          if (businessId && clientId) {
            const messages = await getInboxMessages(businessId, clientId);
            const unread = messages.filter(m => m.readStates && !m.readStates.client).length;
            setUnreadInboxCount(unread);
          }
        }
      } catch (err) {
        console.error('Failed to load unread inbox count:', err);
      }
    }
    
    loadUnreadInbox();
    
    // Also update when messages are marked as read
    window.addEventListener('messagesRead', loadUnreadInbox);
    
    return () => {
      window.removeEventListener('messagesRead', loadUnreadInbox);
    };
  }, [location.pathname]); // Refresh when route changes

  useEffect(() => {
    (async () => {
      const raw = localStorage.getItem('pt_client') || localStorage.getItem('pt_user');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        const businessId = parsed.businessId;
        
        if (businessId) {
          const business = await businessApi.getBusiness(businessId);
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
    clearSession('CLIENT');
    navigate('/client/login');
  }

  const navItems = [
    { path: '/client/dashboard', label: 'Dashboard' },
    { path: '/client/notifications', label: 'Notifications', badge: unreadCount },
    { path: '/client/messages', label: 'Messages', badge: unreadInboxCount },
    { path: '/client/dogs', label: 'My Dogs' },
    { path: '/client/bookings', label: 'Bookings' },
    { path: '/client/invoices', label: 'Invoices' },
    { path: '/client/profile', label: 'Profile' },
    { path: '/client/support', label: 'Support' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
