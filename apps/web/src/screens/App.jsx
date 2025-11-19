// src/screens/App.jsx
// Minimal CRM UI for dog-walking businesses.
// Admin dashboard + staff/clients/dogs/services/jobs + basic job creation.

import React, { useEffect, useState } from 'react';
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
import { repo } from '../../../api/src/repo.js';
import { ClientLogin } from './ClientLogin';
import { ClientRegister } from './ClientRegister';
import { ClientDashboard } from './ClientDashboard';
import { QrEntry } from './QrEntry';
import { ClientBook } from './ClientBook';
import { AdminBookingRequests } from './AdminBookingRequests';
import { AdminInvoices } from './AdminInvoices';
import { ClientInvoices } from './ClientInvoices';
import { BusinessCalendar } from './BusinessCalendar';
import { StaffCalendar } from './StaffCalendar';
import { AdminBulkRecurring } from './AdminBulkRecurring';
import { ClientFlexiBook } from './ClientFlexiBook';
import { ClientOnboarding } from './ClientOnboarding';
import { StaffDashboard } from './StaffDashboard';
import { StaffJobs } from './StaffJobs';
import { StaffAvailability } from './StaffAvailability';
import { StaffSettings } from './StaffSettings';
import { AdminSettings } from './AdminSettings';
import { AdminPanel } from './AdminPanel';
import { ClientGuard } from '../components/ClientGuard';
import { AdminDashboard } from './AdminDashboard';
import { AdminClients } from './AdminClients';
import { AdminClientDetail } from './AdminClientDetail';
import { ServicesList } from './ServicesList';
import { BookingsList } from './BookingsList';
import { Staff } from './admin/Staff';

function useCrmBootstrap() {
  const [state, setState] = useState({
    loading: true,
    business: null,
    admin: null,
    staff: []
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await repo.listBusinesses();
      let biz = existing[0];
      if (!biz) {
        biz = await repo.createBusiness({
          name: 'Demo Dog Walking'
        });
      }

      let users = await repo.listUsersByBusiness(biz.id);
      let admin = users.find(u => u.role === 'ADMIN');
      if (!admin) {
        admin = await repo.createUser({
          businessId: biz.id,
          role: 'ADMIN',
          name: 'Business Owner',
          email: 'owner@example.com'
        });
        users = await repo.listUsersByBusiness(biz.id);
      }

      let staff = users.filter(u => u.role === 'STAFF');
      if (staff.length === 0) {
        const s1 = await repo.createUser({
          businessId: biz.id,
          role: 'STAFF',
          name: 'Walker One',
          email: 'walker1@example.com'
        });
        staff = [s1];
      }

      const services = await repo.listServicesByBusiness(biz.id);
      if (services.length === 0) {
        await repo.createService({
          businessId: biz.id,
          name: '30-Min Walk',
          durationMinutes: 30,
          priceCents: 1000
        });
        await repo.createService({
          businessId: biz.id,
          name: '60-Min Walk',
          durationMinutes: 60,
          priceCents: 1500
        });
        await repo.createService({
          businessId: biz.id,
          name: 'Overnight Stay',
          durationMinutes: 24 * 60,
          priceCents: 5000
        });
      }

      if (!cancelled) {
        setState({
          loading: false,
          business: biz,
          admin,
          staff
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

function StaffList({ business }) {
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({ name: '', email: '' });

  useEffect(() => {
    (async () => {
      if (!business) return;
      const s = await repo.listStaffByBusiness(business.id);
      setStaff(s);
    })();
  }, [business]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await repo.createUser({
      businessId: business.id,
      role: 'STAFF',
      name: form.name,
      email: form.email
    });
    const s = await repo.listStaffByBusiness(business.id);
    setStaff(s);
    setForm({ name: '', email: '' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Staff</h1>
      <form onSubmit={handleSubmit} className="card space-y-3 max-w-md">
        <h2 className="font-semibold">Add staff member</h2>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Email (optional)"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <button className="btn btn-primary text-sm" type="submit">
          Save
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Team</h2>
        {staff.length === 0 ? (
          <p className="text-sm text-slate-600">No staff yet.</p>
        ) : (
          <ul className="divide-y">
            {staff.map(s => (
              <li key={s.id} className="py-2 flex justify-between text-sm">
                <div>
                  <div className="font-medium">{s.name}</div>
                  {s.email && (
                    <div className="text-slate-500 text-xs">{s.email}</div>
                  )}
                </div>
                <span className="badge">{s.role}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ClientList({ business }) {
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    (async () => {
      if (!business) return;
      const c = await repo.listClientsByBusiness(business.id);
      setClients(c);
    })();
  }, [business]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await repo.createClient({
      businessId: business.id,
      name: form.name,
      email: form.email,
      phone: form.phone
    });
    const c = await repo.listClientsByBusiness(business.id);
    setClients(c);
    setForm({ name: '', email: '', phone: '' });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Clients</h1>
      <form onSubmit={handleSubmit} className="card space-y-3 max-w-md">
        <h2 className="font-semibold">Add client</h2>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Phone"
          value={form.phone}
          onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
        />
        <button className="btn btn-primary text-sm" type="submit">
          Save
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Client list</h2>
        {clients.length === 0 ? (
          <p className="text-sm text-slate-600">No clients yet.</p>
        ) : (
          <ul className="divide-y">
            {clients.map(c => (
              <li key={c.id} className="py-2 text-sm">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">
                  {c.email || 'No email'} · {c.phone || 'No phone'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function DogList({ business }) {
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [form, setForm] = useState({
    clientId: '',
    name: '',
    breed: ''
  });

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [c, d] = await Promise.all([
        repo.listClientsByBusiness(business.id),
        repo.listDogsByBusiness(business.id)
      ]);
      setClients(c);
      setDogs(d);
    })();
  }, [business]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.clientId) return;
    await repo.createDog({
      clientId: form.clientId,
      name: form.name,
      breed: form.breed
    });
    const d = await repo.listDogsByBusiness(business.id);
    setDogs(d);
    setForm(f => ({ ...f, name: '', breed: '' }));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Dogs</h1>
      <form onSubmit={handleSubmit} className="card space-y-3 max-w-md">
        <h2 className="font-semibold">Add dog</h2>
        <select
          className="w-full border rounded px-3 py-2 text-sm"
          value={form.clientId}
          onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
        >
          <option value="">Select client</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Dog name"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Breed (optional)"
          value={form.breed}
          onChange={e => setForm(f => ({ ...f, breed: e.target.value }))}
        />
        <button className="btn btn-primary text-sm" type="submit">
          Save
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Dog list</h2>
        {dogs.length === 0 ? (
          <p className="text-sm text-slate-600">No dogs yet.</p>
        ) : (
          <ul className="divide-y">
            {dogs.map(d => (
              <li key={d.id} className="py-2 text-sm">
                <div className="font-medium">{d.name}</div>
                <div className="text-xs text-slate-500">
                  {d.breed || 'Unknown breed'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ServiceList({ business }) {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: '',
    durationMinutes: 30,
    priceCents: 0
  });

  useEffect(() => {
    (async () => {
      if (!business) return;
      const s = await repo.listServicesByBusiness(business.id);
      setServices(s);
    })();
  }, [business]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) return;
    await repo.createService({
      businessId: business.id,
      name: form.name,
      durationMinutes: Number(form.durationMinutes) || 30,
      priceCents: Math.round(Number(form.priceCents) || 0)
    });
    const s = await repo.listServicesByBusiness(business.id);
    setServices(s);
    setForm({ name: '', durationMinutes: 30, priceCents: 0 });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Services</h1>
      <form onSubmit={handleSubmit} className="card space-y-3 max-w-md">
        <h2 className="font-semibold">Add service</h2>
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Service name (e.g. 30-min walk)"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="number"
          min="5"
          placeholder="Duration (minutes)"
          value={form.durationMinutes}
          onChange={e =>
            setForm(f => ({ ...f, durationMinutes: e.target.value }))
          }
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="number"
          min="0"
          placeholder="Price (pence)"
          value={form.priceCents}
          onChange={e =>
            setForm(f => ({ ...f, priceCents: e.target.value }))
          }
        />
        <button className="btn btn-primary text-sm" type="submit">
          Save
        </button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Service list</h2>
        {services.length === 0 ? (
          <p className="text-sm text-slate-600">No services yet.</p>
        ) : (
          <ul className="divide-y">
            {services.map(s => (
              <li key={s.id} className="py-2 text-sm flex justify-between">
                <div>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    {s.durationMinutes} min · £{(s.priceCents / 100).toFixed(2)}
                  </div>
                </div>
                <span className="badge">Active</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function JobList({ business }) {
  const [jobs, setJobs] = useState([]);
  const [clients, setClients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [j, c, s, st] = await Promise.all([
        repo.listJobsByBusiness(business.id),
        repo.listClientsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listStaffByBusiness(business.id)
      ]);
      setJobs(j);
      setClients(c);
      setServices(s);
      setStaff(st);
    })();
  }, [business]);

  const clientById = Object.fromEntries(clients.map(c => [c.id, c]));
  const serviceById = Object.fromEntries(services.map(s => [s.id, s]));
  const staffById = Object.fromEntries(staff.map(s => [s.id, s]));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Jobs</h1>
        <Link className="btn btn-primary text-sm" to="/admin/jobs/new">
          New job
        </Link>
      </div>

      <div className="card">
        {jobs.length === 0 ? (
          <p className="text-sm text-slate-600">No jobs yet.</p>
        ) : (
          <ul className="divide-y">
            {jobs
              .slice()
              .sort((a, b) => (a.start || '').localeCompare(b.start || ''))
              .map(j => {
                const client = clientById[j.clientId];
                const svc = serviceById[j.serviceId];
                const staffMember = staffById[j.staffId];
                return (
                  <li key={j.id} className="py-2 text-sm">
                    <div className="flex justify-between">
                      <div>
                        <div className="font-medium">
                          {svc?.name || 'Job'} ·{' '}
                          {client?.name || 'Unknown client'}
                        </div>
                        <div className="text-xs text-slate-500">
                          {j.start
                            ? new Date(j.start).toLocaleString()
                            : 'No start time'}{' '}
                          {staffMember
                            ? `· ${staffMember.name}`
                            : '· Unassigned'}
                        </div>
                      </div>
                      <span className="badge">{j.status}</span>
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}

function JobCreate({ business }) {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [dogs, setDogs] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState({
    clientId: '',
    dogId: '',
    serviceId: '',
    staffId: '',
    startLocal: '',
    notes: ''
  });

  useEffect(() => {
    (async () => {
      if (!business) return;
      const [c, d, s, st] = await Promise.all([
        repo.listClientsByBusiness(business.id),
        repo.listDogsByBusiness(business.id),
        repo.listServicesByBusiness(business.id),
        repo.listStaffByBusiness(business.id)
      ]);
      setClients(c);
      setDogs(d);
      setServices(s);
      setStaff(st);
    })();
  }, [business]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.clientId || !form.dogId || !form.serviceId || !form.startLocal)
      return;

    const startIso = new Date(form.startLocal).toISOString();

    await repo.createJob({
      businessId: business.id,
      clientId: form.clientId,
      dogIds: [form.dogId],
      staffId: form.staffId || null,
      serviceId: form.serviceId,
      start: startIso,
      notes: form.notes
    });

    navigate('/admin/jobs');
  }

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-xl font-semibold">Create job</h1>
      <form onSubmit={handleSubmit} className="card space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.clientId}
            onChange={e =>
              setForm(f => ({ ...f, clientId: e.target.value, dogId: '' }))
            }
          >
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.dogId}
            onChange={e => setForm(f => ({ ...f, dogId: e.target.value }))}
          >
            <option value="">Select dog</option>
            {dogs
              .filter(d => !form.clientId || d.clientId === form.clientId)
              .map(d => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.serviceId}
            onChange={e => setForm(f => ({ ...f, serviceId: e.target.value }))}
          >
            <option value="">Select service</option>
            {services.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2 text-sm"
            value={form.staffId}
            onChange={e => setForm(f => ({ ...f, staffId: e.target.value }))}
          >
            <option value="">Assign staff (optional)</option>
            {staff.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="datetime-local"
          value={form.startLocal}
          onChange={e => setForm(f => ({ ...f, startLocal: e.target.value }))}
        />

        <textarea
          className="w-full border rounded px-3 py-2 text-sm"
          rows={3}
          placeholder="Notes (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
        />

        <div className="flex gap-3">
          <button className="btn btn-primary text-sm" type="submit">
            Create job
          </button>
          <button
            type="button"
            className="btn btn-ghost text-sm"
            onClick={() => navigate('/admin/jobs')}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, business, admin, staff } = useCrmBootstrap();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Initialising Pawtimation CRM…
      </div>
    );
  }

  const currentUser = admin || { name: 'Admin', role: 'ADMIN' };
  const primaryStaff = staff[0];
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
              path="/admin/dogs"
              element={
                <DashboardLayout user={currentUser}>
                  <DogList business={business} />
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
              path="/admin/jobs"
              element={
                <DashboardLayout user={currentUser}>
                  <JobList business={business} />
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
              path="/admin/jobs/new"
              element={
                <DashboardLayout user={currentUser}>
                  <JobCreate business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/requests"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminBookingRequests business={business} />
                </DashboardLayout>
              }
            />
            <Route
              path="/admin/invoices"
              element={
                <DashboardLayout user={currentUser}>
                  <AdminInvoices business={business} />
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
                  <AdminInvoices business={business} />
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
              path="/staff"
              element={
                <DashboardLayout user={primaryStaff}>
                  <StaffDashboard />
                </DashboardLayout>
              }
            />
            <Route
              path="/staff/calendar"
              element={
                <DashboardLayout user={primaryStaff}>
                  <StaffCalendar business={business} staffUser={primaryStaff} />
                </DashboardLayout>
              }
            />
            <Route
              path="/staff/jobs"
              element={
                <DashboardLayout user={primaryStaff}>
                  <StaffJobs />
                </DashboardLayout>
              }
            />
            <Route
              path="/staff/availability"
              element={
                <DashboardLayout user={primaryStaff}>
                  <StaffAvailability />
                </DashboardLayout>
              }
            />
            <Route
              path="/staff/settings"
              element={
                <DashboardLayout user={primaryStaff}>
                  <StaffSettings />
                </DashboardLayout>
              }
            />

            <Route path="/client/login" element={<ClientLogin />} />
            <Route path="/client/register" element={<ClientRegister />} />
            <Route path="/client/onboarding" element={<ClientOnboarding />} />
            <Route
              path="/client/dashboard"
              element={
                <ClientGuard>
                  <ClientDashboard />
                </ClientGuard>
              }
            />
            <Route
              path="/client/book"
              element={
                <ClientGuard>
                  <ClientBook />
                </ClientGuard>
              }
            />
            <Route
              path="/client/flexi"
              element={
                <ClientGuard>
                  <ClientFlexiBook />
                </ClientGuard>
              }
            />
            <Route
              path="/client/invoices"
              element={
                <ClientGuard>
                  <ClientInvoices />
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
      <AppLayout />
    </BrowserRouter>
  );
}
