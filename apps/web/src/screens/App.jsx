// src/screens/App.jsx
// Minimal CRM UI for dog-walking businesses.
// Admin dashboard + staff/clients/dogs/services/jobs + basic job creation.

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Link
} from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ChatWidget } from '../components/ChatWidget';
import { DashboardLayout } from '../components/DashboardLayout';
import DateTimePicker from '../components/DateTimePicker';
import { getTodayDate } from '../lib/timeUtils';
// Removed backend repo import - frontend should use API calls only
import { auth } from '../lib/auth';
import { ClientLogin } from './ClientLogin';
import { ClientRegister } from './ClientRegister';
import { ClientDashboard } from './ClientDashboard';
import { QrEntry } from './QrEntry';
import { ClientBook } from './ClientBook';
import { PendingRequests } from './business/PendingRequests';
import { AdminFinancial } from './AdminFinancial';
import { ClientInvoices } from './ClientInvoices';
import { BusinessCalendar } from './BusinessCalendar';
import { StaffCalendar } from './StaffCalendar';
import { AdminBulkRecurring } from './AdminBulkRecurring';
import { ClientFlexiBook } from './ClientFlexiBook';
import { ClientOnboarding } from './ClientOnboarding';
import { StaffDashboard } from './StaffDashboard';
import { StaffJobs } from './StaffJobs';
import { StaffMobileJobDetail } from './StaffMobileJobDetail';
import { StaffAvailability } from './StaffAvailability';
import { StaffSettings } from './StaffSettings';
import StaffLogin from './staff/StaffLogin';
import { StaffMobileLayout } from '../components/StaffMobileLayout';
import { StaffToday } from './StaffToday';
import { StaffSimpleCalendar } from './StaffSimpleCalendar';
import { StaffMessages } from './StaffMessages';
import { AdminSettings } from './AdminSettings';
import { AdminPanel } from './AdminPanel';
import { ClientGuard } from '../components/ClientGuard';
import { ClientLayout } from '../components/ClientLayout';
import { AdminDashboard } from './AdminDashboard';
import { AdminClients } from './AdminClients';
import { AdminClientDetail } from './AdminClientDetail';
import { ServicesList } from './ServicesList';
import { BookingsList } from './BookingsList';
import { Staff } from './admin/Staff';
import { StaffDetail } from './admin/StaffDetail';
import { ClientDogs } from './client/ClientDogs';
import { ClientBookings } from './client/ClientBookings';
import { ClientBookingsNew } from './client/ClientBookingsNew';
import { ClientHome } from './client/ClientHome';
import { ClientEditBooking } from './client/ClientEditBooking';
import { ClientProfile } from './client/ClientProfile';
import { ClientSupport } from './client/ClientSupport';
import { ClientNotifications } from './client/ClientNotifications';
import { ClientBookingMessages } from './client/ClientBookingMessages';
import { ClientInbox } from './client/ClientInbox';
import { ClientMessagesNew } from './client/ClientMessagesNew';
import { ClientSettings } from './client/ClientSettings';
import { ClientMobileLayout } from '../components/ClientMobileLayout';
import { BookingMessages } from './business/BookingMessages';
import { BusinessInbox } from './business/BusinessInbox';
import { AdminMobileLayout } from '../layouts/AdminMobileLayout';
import { AdminMobileDashboard } from './admin/mobile/AdminMobileDashboard';
import { AdminMobileClients } from './admin/mobile/AdminMobileClients';
import { AdminMobileClientDetail } from './admin/mobile/AdminMobileClientDetail';
import { AdminMobileCalendar } from './admin/mobile/AdminMobileCalendar';
import { AdminMobileJobs } from './admin/mobile/AdminMobileJobs';
import { AdminMobileJobDetail } from './admin/mobile/AdminMobileJobDetail';
import { AdminMobileInvoices } from './admin/mobile/AdminMobileInvoices';
import { AdminMobileInvoiceDetail } from './admin/mobile/AdminMobileInvoiceDetail';
import { AdminMobileMenu } from './admin/mobile/AdminMobileMenu';
import { AdminMobileSettings } from './admin/mobile/AdminMobileSettings';
import { AdminMobileBusinessDetails } from './admin/mobile/AdminMobileBusinessDetails';
import { AdminMobileHours } from './admin/mobile/AdminMobileHours';
import { AdminMobilePolicies } from './admin/mobile/AdminMobilePolicies';
import { AdminMobileBranding } from './admin/mobile/AdminMobileBranding';
import { Login } from './Login';
import { Register } from './Register';
import { AdminLogin } from './AdminLogin';
import { BusinessProvider, useBusiness } from '../contexts/BusinessContext';

// Removed useCrmBootstrap and inline repo-dependent components (StaffList, ClientList, DogList, ServiceList, JobList, JobCreate)
// All data now comes from authenticated API calls, not backend repo


function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use BusinessContext instead of direct auth.user access
  const { business, loading: businessLoading } = useBusiness();
  
  const admin = auth.user && (auth.user.role === 'ADMIN' || auth.user.role === 'STAFF') 
    ? auth.user 
    : null;
  
  const [businessName, setBusinessName] = useState(() => auth.user?.businessName || '');

  const syncBusinessName = useCallback(() => {
    setBusinessName(auth.user?.businessName || business?.name || 'Your Business');
  }, [business?.name]);

  useEffect(() => {
    if (business) {
      syncBusinessName();
    }
  }, [business?.name, syncBusinessName]);

  useEffect(() => {
    const handleBusinessUpdate = () => {
      syncBusinessName();
    };
    window.addEventListener('businessNameUpdated', handleBusinessUpdate);
    return () => window.removeEventListener('businessNameUpdated', handleBusinessUpdate);
  }, [syncBusinessName]);

  const currentUser = useMemo(
    () => admin ? { ...admin, businessName } : { name: 'Admin', role: 'ADMIN', businessName },
    [admin, businessName]
  );
  
  const primaryStaff = useMemo(
    () => auth.user && auth.user.role === 'STAFF' ? { ...auth.user, businessName } : null,
    [businessName]
  );
  
  const isAdminRoute = location.pathname.startsWith('/admin') || location.pathname.startsWith('/staff');

  function handleNav(path) {
    navigate(path);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        <div className={isAdminRoute ? '' : 'max-w-5xl mx-auto px-4 py-4 md:px-6 md:py-6'}>
          {!isAdminRoute && (
            <Header onNav={handleNav} user={currentUser} />
          )}
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardLayout user={currentUser}>
                  <AdminDashboard business={business} />
                </DashboardLayout>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <DashboardLayout user={currentUser}>
                  <AdminDashboard business={business} />
                </DashboardLayout>
              } 
            />
            <Route
              path="/admin/staff"
              element={
                <DashboardLayout user={currentUser}>
                  <Staff business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/staff/:staffId"
              element={
                <DashboardLayout user={currentUser}>
                  <StaffDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/clients"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminClients business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/clients/:clientId"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminClientDetail />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/services"
              element={
                <DashboardLayout user={currentUser}>
                  <ServicesList business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <DashboardLayout user={currentUser}>
                  <BookingsList business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <DashboardLayout user={currentUser}>
                  <PendingRequests />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/booking/messages"
              element={
                <DashboardLayout user={currentUser}>
                  <BookingMessages />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/messages"
              element={
                <DashboardLayout user={currentUser}>
                  <BusinessInbox />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminFinancial business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/calendar"
              element={
                <DashboardLayout user={currentUser}>
                  <BusinessCalendar business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/recurring"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminBulkRecurring business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/invoicing"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminFinancial business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminSettings business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/panel"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminPanel business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/m/dashboard"
              element={
                <AdminMobileLayout>
                  <AdminMobileDashboard />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/clients"
              element={
                <AdminMobileLayout>
                  <AdminMobileClients />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/clients/:clientId"
              element={
                <AdminMobileLayout>
                  <AdminMobileClientDetail />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/calendar"
              element={
                <AdminMobileLayout>
                  <AdminMobileCalendar />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/jobs"
              element={
                <AdminMobileLayout>
                  <AdminMobileJobs />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/jobs/:bookingId"
              element={
                <AdminMobileLayout>
                  <AdminMobileJobDetail />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/invoices"
              element={
                <AdminMobileLayout>
                  <AdminMobileInvoices />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/invoices/:invoiceId"
              element={
                <AdminMobileLayout>
                  <AdminMobileInvoiceDetail />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/menu"
              element={
                <AdminMobileLayout>
                  <AdminMobileMenu />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/settings"
              element={
                <AdminMobileLayout>
                  <AdminMobileSettings />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/settings/business"
              element={
                <AdminMobileLayout>
                  <AdminMobileBusinessDetails />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/settings/hours"
              element={
                <AdminMobileLayout>
                  <AdminMobileHours />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/settings/policies"
              element={
                <AdminMobileLayout>
                  <AdminMobilePolicies />
                </AdminMobileLayout>
              }
            />
            <Route
              path="/admin/m/settings/branding"
              element={
                <AdminMobileLayout>
                  <AdminMobileBranding />
                </AdminMobileLayout>
              }
            />

            <Route path="/staff/login" element={<StaffLogin />} />
            <Route
              path="/staff"
              element={
                <StaffMobileLayout>
                  <StaffToday />
                </StaffMobileLayout>
              }
            />
            <Route
              path="/staff/calendar"
              element={
                <StaffMobileLayout>
                  <StaffSimpleCalendar />
                </StaffMobileLayout>
              }
            />
            <Route
              path="/staff/jobs/:bookingId"
              element={<StaffMobileJobDetail />}
            />
            <Route
              path="/staff/messages"
              element={
                <StaffMobileLayout>
                  <StaffMessages />
                </StaffMobileLayout>
              }
            />
            <Route
              path="/staff/settings"
              element={
                <StaffMobileLayout>
                  <StaffSettings />
                </StaffMobileLayout>
              }
            />

            <Route path="/auth/login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/auth/register" element={<Register />} />

            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/client/register" element={<ClientRegister />} />
            <Route path="/client/onboarding" element={<ClientOnboarding />} />
            <Route
              path="/client/dashboard"
              element={<Navigate to="/client/home" replace />}
            />
            <Route
              path="/client/dogs"
              element={
                <ClientGuard>
                  <ClientMobileLayout>
                    <ClientDogs />
                  </ClientMobileLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/home"
              element={
                <ClientGuard>
                  <ClientMobileLayout>
                    <ClientHome />
                  </ClientMobileLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/bookings"
              element={
                <ClientGuard>
                  <ClientMobileLayout>
                    <ClientBookingsNew />
                  </ClientMobileLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/notifications"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientNotifications />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/booking/messages"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientBookingMessages />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/messages"
              element={
                <ClientGuard>
                  <ClientMobileLayout>
                    <ClientMessagesNew />
                  </ClientMobileLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/settings"
              element={
                <ClientGuard>
                  <ClientMobileLayout>
                    <ClientSettings />
                  </ClientMobileLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/book"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientBook />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/book/edit"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientEditBooking />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/flexi"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientFlexiBook />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientInvoices />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/profile"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientProfile />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route
              path="/client/support"
              element={
                <ClientGuard>
                  <ClientLayout>
                    <ClientSupport />
                  </ClientLayout>
                </ClientGuard>
              }
            />
            <Route path="/qr/:businessId" element={<QrEntry />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      {!isAdminRoute && (
        <>
          <Footer onNav={handleNav} />
          <ChatWidget />
        </>
      )}
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <BusinessProvider>
        <AppLayout />
      </BusinessProvider>
    </BrowserRouter>
  );
}
