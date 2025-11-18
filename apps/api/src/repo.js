// repo.js
// Repository layer for Pawtimation CRM.
// Multi-business, staff, clients, dogs, services, jobs, invoices, availability.
// Designed to be used from both backend and frontend (in-memory DB).

import { db } from './store.js';
import { nid } from './utils.js';

const isoNow = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/*  BUSINESS                                                                  */
/* -------------------------------------------------------------------------- */

async function createBusiness(data) {
  const id = data.id || ('biz_' + nid());
  const biz = {
    id,
    name: data.name || 'Untitled Business',
    ownerUserId: data.ownerUserId || null,
    settings: data.settings || {
      currency: 'gbp',
      invoicePrefix: 'INV',
      brandingColor: '#16a34a'
    }
  };
  db.businesses[id] = biz;
  return biz;
}

async function getBusiness(id) {
  return db.businesses[id] || null;
}

async function updateBusiness(id, patch) {
  if (!db.businesses[id]) return null;
  db.businesses[id] = { ...db.businesses[id], ...patch };
  return db.businesses[id];
}

async function listBusinesses() {
  return Object.values(db.businesses);
}

/* -------------------------------------------------------------------------- */
/*  USERS (ADMIN + STAFF)                                                     */
/* -------------------------------------------------------------------------- */

async function createUser(data) {
  const id = data.id || ('u_' + nid());
  const user = {
    id,
    businessId: data.businessId || null,
    role: data.role || 'STAFF',
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    active: data.active !== false
  };
  db.users[id] = user;
  return user;
}

async function getUser(id) {
  return db.users[id] || null;
}

async function listUsersByBusiness(businessId) {
  return Object.values(db.users).filter(u => u.businessId === businessId);
}

async function listStaffByBusiness(businessId) {
  return Object.values(db.users).filter(
    u => u.businessId === businessId && u.role === 'STAFF'
  );
}

/* -------------------------------------------------------------------------- */
/*  CLIENTS                                                                   */
/* -------------------------------------------------------------------------- */

async function createClient(data) {
  const id = data.id || ('c_' + nid());
  const client = {
    id,
    businessId: data.businessId,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    notes: data.notes || '',
    dogIds: data.dogIds || []
  };
  db.clients[id] = client;
  return client;
}

async function getClient(id) {
  return db.clients[id] || null;
}

async function listClientsByBusiness(businessId) {
  return Object.values(db.clients).filter(c => c.businessId === businessId);
}

/* -------------------------------------------------------------------------- */
/*  CLIENT AUTH                                                               */
/* -------------------------------------------------------------------------- */

async function registerClientUser({ businessId, name, email, password }) {
  if (!businessId) throw new Error('businessId is required');
  if (!email) throw new Error('email is required');

  let client = Object.values(db.clients).find(
    c => c.businessId === businessId && c.email === email
  );

  if (!client) {
    client = await createClient({
      businessId,
      name: name || email,
      email,
      phone: '',
      address: '',
      notes: ''
    });
  }

  client.loginEmail = email;
  client.loginPassword = password;
  db.clients[client.id] = client;

  return client;
}

async function loginClientUser({ businessId, email, password }) {
  if (!businessId || !email || !password) return null;

  const client = Object.values(db.clients).find(
    c =>
      c.businessId === businessId &&
      (c.loginEmail || c.email) === email &&
      c.loginPassword === password
  );

  return client || null;
}

async function getClientById(id) {
  return db.clients[id] || null;
}

/* -------------------------------------------------------------------------- */
/*  DOGS                                                                      */
/* -------------------------------------------------------------------------- */

async function createDog(data) {
  const id = data.id || ('dog_' + nid());
  const dog = {
    id,
    clientId: data.clientId,
    name: data.name || '',
    breed: data.breed || '',
    age: data.age || null,
    behaviour: data.behaviour || {},
    notes: data.notes || ''
  };
  db.dogs[id] = dog;

  if (dog.clientId && db.clients[dog.clientId]) {
    const c = db.clients[dog.clientId];
    if (!c.dogIds.includes(id)) c.dogIds.push(id);
  }

  db.pets[id] = { id, ...dog };

  return dog;
}

async function getDog(id) {
  return db.dogs[id] || null;
}

async function listDogsByClient(clientId) {
  return Object.values(db.dogs).filter(d => d.clientId === clientId);
}

async function listDogsByBusiness(businessId) {
  const clientIds = Object.values(db.clients)
    .filter(c => c.businessId === businessId)
    .map(c => c.id);
  return Object.values(db.dogs).filter(d => clientIds.includes(d.clientId));
}

/* -------------------------------------------------------------------------- */
/*  SERVICES                                                                  */
/* -------------------------------------------------------------------------- */

async function createService(data) {
  const id = data.id || ('svc_' + nid());
  const svc = {
    id,
    businessId: data.businessId,
    name: data.name || 'Service',
    durationMinutes: data.durationMinutes ?? 30,
    priceCents: data.priceCents ?? 0,
    active: data.active !== false
  };
  db.services[id] = svc;
  return svc;
}

async function getService(id) {
  return db.services[id] || null;
}

async function listServicesByBusiness(businessId) {
  return Object.values(db.services).filter(s => s.businessId === businessId);
}

/* -------------------------------------------------------------------------- */
/*  AVAILABILITY                                                              */
/* -------------------------------------------------------------------------- */

async function setStaffAvailability(staffId, slots) {
  db.availability[staffId] = Array.isArray(slots) ? slots : [];
  return db.availability[staffId];
}

async function getStaffAvailability(staffId) {
  return db.availability[staffId] || [];
}

/* -------------------------------------------------------------------------- */
/*  JOBS                                                                      */
/* -------------------------------------------------------------------------- */

function rangesOverlap(startA, endA, startB, endB) {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();
  return aStart < bEnd && bStart < aEnd;
}

const BLOCKING_STATUSES = new Set([
  'PENDING',
  'APPROVED',
  'SCHEDULED',
  'COMPLETE',
  'COMPLETED'
]);

async function createJob(data) {
  const id = data.id || ('job_' + nid());
  const svc = data.serviceId ? db.services[data.serviceId] : null;

  const start = data.start;
  let end = data.end;

  if (!end && svc && svc.durationMinutes) {
    const ms = new Date(start).getTime() + svc.durationMinutes * 60 * 1000;
    end = new Date(ms).toISOString();
  }

  const job = {
    id,
    businessId: data.businessId,
    clientId: data.clientId,
    dogIds: data.dogIds || [],
    staffId: data.staffId || null,
    serviceId: data.serviceId || null,
    start,
    end,
    status: data.status || 'PENDING',
    priceCents:
      data.priceCents ??
      (svc && typeof svc.priceCents === 'number' ? svc.priceCents : 0),
    notes: data.notes || '',
    createdAt: isoNow(),
    updatedAt: isoNow()
  };

  db.jobs[id] = job;
  db.bookings[id] = job;

  return job;
}

async function getJob(id) {
  return db.jobs[id] || null;
}

async function updateJob(id, patch) {
  if (!db.jobs[id]) return null;
  db.jobs[id] = { ...db.jobs[id], ...patch, updatedAt: isoNow() };
  db.bookings[id] = db.jobs[id];
  return db.jobs[id];
}

async function listJobsByBusiness(businessId) {
  return Object.values(db.jobs).filter(j => j.businessId === businessId);
}

async function listJobsByStaffAndRange(staffId, startIso, endIso) {
  return Object.values(db.jobs).filter(j => {
    if (j.staffId !== staffId) return false;
    if (!j.start || !j.end) return false;
    if (!BLOCKING_STATUSES.has(j.status || 'PENDING')) return false;
    return rangesOverlap(j.start, j.end, startIso, endIso);
  });
}

async function assignStaffToJob(jobId, staffId) {
  if (!db.jobs[jobId]) return null;
  db.jobs[jobId].staffId = staffId;
  db.jobs[jobId].updatedAt = isoNow();
  db.bookings[jobId] = db.jobs[jobId];
  return db.jobs[jobId];
}

async function setJobStatus(jobId, status) {
  if (!db.jobs[jobId]) return null;
  db.jobs[jobId].status = status;
  db.jobs[jobId].updatedAt = isoNow();
  db.bookings[jobId] = db.jobs[jobId];
  return db.jobs[jobId];
}

async function listAvailableStaffForSlot(businessId, startIso, endIso) {
  const staff = await listStaffByBusiness(businessId);
  const result = [];

  for (const s of staff) {
    const jobs = await listJobsByStaffAndRange(s.id, startIso, endIso);
    const isFree = jobs.length === 0;
    result.push({ staff: s, isFree, conflictingJobs: jobs });
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/*  INVOICES                                                                  */
/* -------------------------------------------------------------------------- */

async function createInvoice(data) {
  const id = data.id || ('inv_' + nid());
  const inv = {
    id,
    businessId: data.businessId,
    clientId: data.clientId,
    jobId: data.jobId || null,
    amountCents: data.amountCents || 0,
    status: data.status || 'UNPAID',
    createdAt: isoNow(),
    paidAt: data.paidAt || null,
    meta: data.meta || {}
  };
  db.invoices[id] = inv;
  return inv;
}

async function getInvoice(id) {
  return db.invoices[id] || null;
}

async function markInvoicePaid(id) {
  if (!db.invoices[id]) return null;
  db.invoices[id].status = 'PAID';
  db.invoices[id].paidAt = isoNow();
  return db.invoices[id];
}

async function listInvoicesByBusiness(businessId) {
  return Object.values(db.invoices).filter(i => i.businessId === businessId);
}

/* -------------------------------------------------------------------------- */
/*  CANCELLATIONS                                                             */
/* -------------------------------------------------------------------------- */

async function recordCancellation(evt) {
  const id = 'cx_' + nid();
  db.cancellations[id] = {
    id,
    ...evt,
    occurredAt: isoNow()
  };
  return db.cancellations[id];
}

/* -------------------------------------------------------------------------- */
/*  JOB NOTES / UPDATES                                                       */
/* -------------------------------------------------------------------------- */

async function addJobUpdate(jobId, upd) {
  db.updates[jobId] = db.updates[jobId] || [];
  db.updates[jobId].push({ ...upd, createdAt: isoNow() });
  return upd;
}

async function getJobFeed(jobId) {
  return {
    job: db.jobs[jobId] || null,
    updates: db.updates[jobId] || []
  };
}

/* -------------------------------------------------------------------------- */
/*  EXPORT                                                                    */
/* -------------------------------------------------------------------------- */

export const repo = {
  createBusiness,
  getBusiness,
  updateBusiness,
  listBusinesses,

  createUser,
  getUser,
  listUsersByBusiness,
  listStaffByBusiness,

  createClient,
  getClient,
  listClientsByBusiness,

  registerClientUser,
  loginClientUser,
  getClientById,

  createDog,
  getDog,
  listDogsByClient,
  listDogsByBusiness,

  createService,
  getService,
  listServicesByBusiness,

  setStaffAvailability,
  getStaffAvailability,

  createJob,
  getJob,
  updateJob,
  listJobsByBusiness,
  listJobsByStaffAndRange,
  assignStaffToJob,
  setJobStatus,
  listAvailableStaffForSlot,

  createInvoice,
  getInvoice,
  markInvoicePaid,
  listInvoicesByBusiness,

  recordCancellation,
  addJobUpdate,
  getJobFeed
};
