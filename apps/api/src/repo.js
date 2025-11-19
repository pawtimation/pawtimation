// repo.js
// Repository layer for Pawtimation CRM.
// Multi-business, staff, clients, dogs, services, jobs, invoices, availability.
// Designed to be used from both backend and frontend (in-memory DB).

import { db } from './store.js';
import { nid } from './utils.js';

const isoNow = () => new Date().toISOString();

/* -------------------------------------------------------------------------- */
/*  BUSINESS SETTINGS HELPERS                                                */
/* -------------------------------------------------------------------------- */

function createEmptyBusinessSettings() {
  return {
    profile: {
      businessName: "",
      serviceArea: "",
      contactEmail: "",
      contactPhone: "",
      addressLine1: "",
      city: "",
      postcode: ""
    },
    hours: {
      mon: { open: true, start: "09:00", end: "17:00" },
      tue: { open: true, start: "09:00", end: "17:00" },
      wed: { open: true, start: "09:00", end: "17:00" },
      thu: { open: true, start: "09:00", end: "17:00" },
      fri: { open: true, start: "09:00", end: "17:00" },
      sat: { open: false, start: "09:00", end: "17:00" },
      sun: { open: false, start: "09:00", end: "17:00" }
    },
    policies: {
      cancellationWindowHours: 24,
      paymentTermsDays: 14
    },
    branding: {
      primaryColor: "#00a58a",
      showPoweredBy: true
    },
    finance: {
      autoInvoicingEnabled: false,
      autoInvoicingFrequency: "disabled",
      autoInvoicingTrigger: "completed",
      sendMode: "draft",
      defaultPaymentTermsDays: 14,
      bankDetails: ""
    },
    services: [],
    permissions: {
      staffRolesEnabled: true,
      roleDefinitions: {
        admin: {
          canSeeFinance: true,
          canEditBusinessSettings: true,
          canViewClients: true,
          canViewClientAddresses: true,
          canViewInvoices: true,
          canApproveJobs: true,
          canAssignJobs: true
        },
        staff: {
          canSeeFinance: false,
          canEditBusinessSettings: false,
          canViewClients: true,
          canViewClientAddresses: false,
          canViewInvoices: false,
          canApproveJobs: false,
          canAssignJobs: false
        }
      }
    },
    automation: {
      // Booking reminders
      bookingReminderEnabled: false,
      bookingReminderHoursBefore: 24,

      // Invoice reminders
      invoiceReminderEnabled: false,
      invoiceReminderDaysOverdue: 3,

      // End-of-day summary
      dailySummaryEnabled: false,
      dailySummaryTime: "18:00",

      // Auto mark completed
      autoCompleteEnabled: false,
      autoCompleteAfterHours: 2,

      // Conflict detection alerts
      conflictAlertsEnabled: true,

      // Weekly revenue snapshot
      weeklySnapshotEnabled: false,
      weeklySnapshotDay: "mon"
    }
  };
}

function mergeBusinessSettings(existing = createEmptyBusinessSettings(), patch = {}) {
  const merged = { ...existing };

  for (const key of Object.keys(patch)) {
    const value = patch[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      // Deep merge for nested objects (e.g., hours.mon, profile fields)
      const existingValue = existing[key] || {};
      merged[key] = {};
      
      // First copy all existing defaults
      for (const nestedKey of Object.keys(existingValue)) {
        const nestedExisting = existingValue[nestedKey];
        if (nestedExisting && typeof nestedExisting === "object" && !Array.isArray(nestedExisting)) {
          merged[key][nestedKey] = { ...nestedExisting };
        } else {
          merged[key][nestedKey] = nestedExisting;
        }
      }
      
      // Then overlay patch values, doing deep merge for nested objects
      for (const nestedKey of Object.keys(value)) {
        const nestedPatch = value[nestedKey];
        if (nestedPatch && typeof nestedPatch === "object" && !Array.isArray(nestedPatch)) {
          merged[key][nestedKey] = { ...(merged[key][nestedKey] || {}), ...nestedPatch };
        } else {
          merged[key][nestedKey] = nestedPatch;
        }
      }
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

/* -------------------------------------------------------------------------- */
/*  BUSINESS                                                                  */
/* -------------------------------------------------------------------------- */

async function createBusiness(data) {
  const id = data.id || ('biz_' + nid());
  const defaultSettings = createEmptyBusinessSettings();
  defaultSettings.profile.businessName = data.name || 'Untitled Business';
  
  const biz = {
    id,
    name: data.name || 'Untitled Business',
    ownerUserId: data.ownerUserId || null,
    currency: 'gbp',
    invoicePrefix: 'INV',
    brandingColor: '#16a34a',
    settings: defaultSettings
  };
  db.businesses[id] = biz;
  return biz;
}

async function getBusiness(id) {
  const biz = db.businesses[id] || null;
  if (biz && !biz.messages) {
    biz.messages = [];
  }
  return biz;
}

async function updateBusiness(id, patch) {
  const existing = db.businesses[id];
  if (!existing) return null;

  const next = { ...existing };

  if (patch.settings) {
    next.settings = mergeBusinessSettings(existing.settings, patch.settings);
  }

  for (const key of Object.keys(patch)) {
    if (key === 'settings') continue;
    next[key] = patch[key];
  }

  db.businesses[id] = next;
  return next;
}

async function listBusinesses() {
  return Object.values(db.businesses);
}

async function getBusinessSettings(id) {
  const business = db.businesses[id];
  if (!business) return null;
  
  // Always merge with defaults to handle legacy businesses and ensure complete structure
  const defaults = createEmptyBusinessSettings();
  const existing = business.settings || {};
  business.settings = mergeBusinessSettings(defaults, existing);
  
  return business.settings;
}

async function updateBusinessSettings(id, settingsPatch) {
  return updateBusiness(id, { settings: settingsPatch });
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
    dogIds: data.dogIds || [],
    profileComplete: data.profileComplete || false,
    onboardingStep: data.onboardingStep || 1,
    accessNotes: data.accessNotes || '',
    emergencyName: data.emergencyName || '',
    emergencyPhone: data.emergencyPhone || '',
    vetDetails: data.vetDetails || '',
    behaviourNotes: data.behaviourNotes || '',
    medicalNotes: data.medicalNotes || '',
    createdAt: data.createdAt || isoNow(),
    updatedAt: isoNow()
  };
  db.clients[id] = client;
  return client;
}

async function getClient(id) {
  return db.clients[id] || null;
}

async function updateClient(id, patch) {
  const existing = db.clients[id];
  if (!existing) return null;
  const updated = {
    ...existing,
    ...patch,
    updatedAt: isoNow()
  };
  db.clients[id] = updated;
  return updated;
}

async function markClientProfileComplete(id) {
  return updateClient(id, {
    profileComplete: true,
    onboardingStep: 999
  });
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

async function updateDog(id, patch) {
  if (!db.dogs[id]) return null;
  Object.assign(db.dogs[id], patch);
  return db.dogs[id];
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

async function updateService(id, patch) {
  if (!db.services[id]) return null;
  Object.assign(db.services[id], patch);
  return db.services[id];
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

async function saveStaffWeeklyAvailability(staffId, availability) {
  const staff = db.users[staffId];
  if (!staff) return null;
  staff.weeklyAvailability = availability;
  return staff;
}

async function getStaffWeeklyAvailability(staffId) {
  const staff = db.users[staffId];
  return staff?.weeklyAvailability || {};
}

async function saveStaffServices(staffId, serviceIds) {
  const staff = db.users[staffId];
  if (!staff) return null;
  staff.services = Array.isArray(serviceIds) ? serviceIds : [];
  return staff;
}

async function findAvailableStaffForSlot(businessId, startIso, endIso, serviceId) {
  const staff = await listStaffByBusiness(businessId);
  const jobs = await listJobsByBusiness(businessId);
  
  const targetStart = new Date(startIso);
  const targetEnd = new Date(endIso);
  
  return staff.filter(member => {
    // Check if staff can perform service (require explicit permission)
    if (serviceId) {
      if (!member.services || !Array.isArray(member.services) || member.services.length === 0) {
        return false;
      }
      if (!member.services.includes(serviceId)) {
        return false;
      }
    }
    
    // Check weekly availability (missing days = unavailable)
    const dayName = targetStart.toLocaleString('en-US', { weekday: 'short' });
    const avail = member.weeklyAvailability?.[dayName];
    
    // If no availability set for this day, staff is unavailable
    if (!avail || !avail.start || !avail.end) {
      return false;
    }
    
    const startTime = timeToDate(targetStart, avail.start);
    const endTime = timeToDate(targetStart, avail.end);
    
    // Check if booking falls within availability window
    if (targetStart < startTime || targetEnd > endTime) {
      return false;
    }
    
    // Check booking conflicts
    const hasConflict = jobs.some(job => {
      if (job.staffId !== member.id) return false;
      if (!BLOCKING_STATUSES.has(job.status)) return false;
      return rangesOverlap(startIso, endIso, job.start, job.end);
    });
    
    return !hasConflict;
  });
}

function timeToDate(date, time) {
  const [h, m] = time.split(':');
  const d = new Date(date);
  d.setHours(Number(h), Number(m), 0, 0);
  return d;
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
  'SCHEDULED',
  'APPROVED',
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
  
  const job = db.jobs[id];
  
  Object.assign(job, patch);
  job.updatedAt = isoNow();
  
  db.bookings[id] = job;
  
  return job;
}

async function listJobsByBusiness(businessId) {
  return Object.values(db.jobs).filter(j => j.businessId === businessId);
}

async function listJobsByClient(clientId) {
  return Object.values(db.jobs).filter(j => j.clientId === clientId);
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
  
  const job = db.jobs[jobId];
  const beforeStatus = job.status;
  
  job.status = status;
  job.updatedAt = isoNow();
  db.bookings[jobId] = job;
  
  // Auto-generate invoice when job moves to COMPLETE or COMPLETED
  if (
    (status === 'COMPLETE' || status === 'COMPLETED') &&
    beforeStatus !== 'COMPLETE' &&
    beforeStatus !== 'COMPLETED'
  ) {
    const svc = db.services[job.serviceId];
    const amount = job.priceCents || svc?.priceCents || 0;
    
    await createInvoice({
      businessId: job.businessId,
      clientId: job.clientId,
      jobId: job.id,
      amountCents: amount
    });
  }
  
  return job;
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
    paymentUrl: `https://pay.stripe.com/link/${id}`, // stubbed
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

async function listInvoicesByClient(clientId) {
  return Object.values(db.invoices).filter(i => i.clientId === clientId);
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
/*  DEMO CLIENT SEEDER (runs once)                                           */
/* -------------------------------------------------------------------------- */

async function seedDemoClient() {
  const businesses = Object.values(db.businesses);
  if (businesses.length === 0) return;

  const biz = businesses[0];

  // If the demo already exists, skip seed.
  const existing = Object.values(db.clients).find(
    c => c.email === 'demo@client.com'
  );
  if (existing) return;

  // Create client with full registration
  await registerClientUser({
    businessId: biz.id,
    name: 'Demo Client',
    email: 'demo@client.com',
    password: 'test123',
    phone: ''
  });

  console.log('✓ Demo client created: demo@client.com / test123');
}

// Run seeder on startup
seedDemoClient();

/* -------------------------------------------------------------------------- */
/*  MESSAGES                                                                  */
/* -------------------------------------------------------------------------- */

function addBusinessMessage(businessId, message) {
  const biz = db.businesses[businessId];
  if (!biz) return null;

  if (!biz.messages) biz.messages = [];

  const msg = {
    id: "msg_" + Math.random().toString(36).slice(2),
    bookingId: message.bookingId || null,
    clientId: message.clientId,
    businessId,
    senderRole: message.senderRole,
    message: message.message,
    createdAt: new Date().toISOString()
  };

  biz.messages.unshift(msg);
  return msg;
}

function listMessagesForBooking(businessId, bookingId) {
  const biz = db.businesses[businessId];
  if (!biz || !biz.messages) return [];
  return biz.messages.filter((m) => m.bookingId === bookingId);
}

function listMessagesForInbox(businessId, clientId) {
  const biz = db.businesses[businessId];
  if (!biz || !biz.messages) return [];
  return biz.messages.filter(
    (m) => !m.bookingId && m.clientId === clientId
  );
}

/* -------------------------------------------------------------------------- */
/*  EXPORT                                                                    */
/* -------------------------------------------------------------------------- */

export const repo = {
  createBusiness,
  getBusiness,
  updateBusiness,
  listBusinesses,
  getBusinessSettings,
  updateBusinessSettings,

  createUser,
  getUser,
  listUsersByBusiness,
  listStaffByBusiness,

  createClient,
  getClient,
  updateClient,
  markClientProfileComplete,
  listClientsByBusiness,

  registerClientUser,
  loginClientUser,
  getClientById,

  createDog,
  getDog,
  updateDog,
  listDogsByClient,
  listDogsByBusiness,

  createService,
  getService,
  updateService,
  listServicesByBusiness,

  setStaffAvailability,
  getStaffAvailability,
  saveStaffWeeklyAvailability,
  getStaffWeeklyAvailability,
  saveStaffServices,
  findAvailableStaffForSlot,

  createJob,
  getJob,
  updateJob,
  listJobsByBusiness,
  listJobsByClient,
  listJobsByStaffAndRange,
  assignStaffToJob,
  setJobStatus,
  listAvailableStaffForSlot,

  createInvoice,
  getInvoice,
  markInvoicePaid,
  listInvoicesByBusiness,
  listInvoicesByClient,

  recordCancellation,
  addJobUpdate,
  getJobFeed,

  addBusinessMessage,
  listMessagesForBooking,
  listMessagesForInbox
};
