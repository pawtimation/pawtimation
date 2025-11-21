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
  const patch = { settings: settingsPatch };
  
  if (settingsPatch.profile?.businessName) {
    patch.name = settingsPatch.profile.businessName;
    console.log(`[updateBusinessSettings] Setting business.name to: "${patch.name}"`);
  }
  
  const result = await updateBusiness(id, patch);
  console.log(`[updateBusinessSettings] Business updated. New name: "${result.name}"`);
  return result;
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
    active: data.active !== false,
    passHash: data.passHash || null,
    isAdmin: data.isAdmin || false
  };
  db.users[id] = user;
  return user;
}

async function getUser(id) {
  return db.users[id] || null;
}

async function getUserByEmail(email) {
  const emailLower = (email || '').toLowerCase();
  return Object.values(db.users).find(u => u.email?.toLowerCase() === emailLower) || null;
}

async function listUsersByBusiness(businessId) {
  return Object.values(db.users).filter(u => u.businessId === businessId);
}

async function listStaffByBusiness(businessId) {
  return Object.values(db.users).filter(
    u => u.businessId === businessId && u.role === 'STAFF'
  );
}

async function listAllUsers() {
  return Object.values(db.users);
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
    lat: data.lat || null,
    lng: data.lng || null,
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
    description: data.description || '',
    durationMinutes: data.durationMinutes ?? 30,
    priceCents: data.priceCents ?? 0,
    group: data.group || false,
    maxDogs: data.maxDogs || 1,
    allowClientBooking: data.allowClientBooking !== false,
    approvalRequired: data.approvalRequired || false,
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
  'BOOKED',
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
    route: data.route || null,
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
  
  // Normalize old status variants
  if (status === 'COMPLETE') status = 'COMPLETED';
  
  const job = db.jobs[jobId];
  const beforeStatus = job.status;
  
  job.status = status;
  job.updatedAt = isoNow();
  db.bookings[jobId] = job;
  
  // Auto-create invoice ITEM only on COMPLETED (and only if it wasn't already COMPLETED)
  if (status === 'COMPLETED' && beforeStatus !== 'COMPLETED') {
    const svc = db.services[job.serviceId];
    const client = db.clients[job.clientId];
    const amount = job.priceCents || svc?.priceCents || 0;
    
    // Create a pending invoice item instead of an invoice
    const jobDate = new Date(job.start);
    const dateStr = jobDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const description = `${svc?.name || 'Service'} (${dateStr})`;
    
    await createInvoiceItem({
      jobId: job.id,
      clientId: job.clientId,
      businessId: job.businessId,
      description,
      quantity: 1,
      priceCents: amount,
      date: job.start,
      status: 'PENDING'
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
    sentToClient: data.sentToClient || null,
    paidAt: data.paidAt || null,
    paymentMethod: data.paymentMethod || null,
    paymentUrl: `https://pay.stripe.com/link/${id}`, // stubbed
    meta: data.meta || {}
  };
  db.invoices[id] = inv;
  return inv;
}

async function getInvoice(id) {
  return db.invoices[id] || null;
}

async function markInvoicePaid(id, paymentMethod = 'cash') {
  if (!db.invoices[id]) return null;
  db.invoices[id].status = 'PAID';
  db.invoices[id].paidAt = isoNow();
  db.invoices[id].paymentMethod = paymentMethod;
  return db.invoices[id];
}

async function markInvoiceSent(id) {
  if (!db.invoices[id]) return null;
  db.invoices[id].sentToClient = isoNow();
  return db.invoices[id];
}

async function listInvoicesByBusiness(businessId) {
  return Object.values(db.invoices).filter(i => i.businessId === businessId);
}

async function listInvoicesByClient(clientId) {
  return Object.values(db.invoices).filter(i => i.clientId === clientId);
}

async function resendInvoice(id) {
  // Stub: In production, this would trigger an email notification
  // For now, we just verify the invoice exists
  if (!db.invoices[id]) return null;
  return { success: true, message: 'Invoice resent successfully' };
}

/* -------------------------------------------------------------------------- */
/*  INVOICE ITEMS                                                             */
/* -------------------------------------------------------------------------- */

async function createInvoiceItem(data) {
  const id = data.id || ('item_' + nid());
  const item = {
    id,
    jobId: data.jobId,
    clientId: data.clientId,
    businessId: data.businessId,
    description: data.description || '',
    quantity: data.quantity || 1,
    priceCents: data.priceCents || 0,
    date: data.date || isoNow(),
    status: data.status || 'PENDING',
    createdAt: isoNow()
  };
  db.invoiceItems[id] = item;
  return item;
}

async function getInvoiceItem(id) {
  return db.invoiceItems[id] || null;
}

async function listInvoiceItemsByBusiness(businessId, status = null) {
  let items = Object.values(db.invoiceItems).filter(i => i.businessId === businessId);
  if (status) {
    items = items.filter(i => i.status === status);
  }
  return items;
}

async function listInvoiceItemsByClient(clientId, status = null) {
  let items = Object.values(db.invoiceItems).filter(i => i.clientId === clientId);
  if (status) {
    items = items.filter(i => i.status === status);
  }
  return items;
}

async function markInvoiceItemBilled(itemId, invoiceId) {
  if (!db.invoiceItems[itemId]) return null;
  db.invoiceItems[itemId].status = 'BILLED';
  db.invoiceItems[itemId].invoiceId = invoiceId;
  db.invoiceItems[itemId].billedAt = isoNow();
  return db.invoiceItems[itemId];
}

async function generateInvoiceFromItems(businessId, clientId, itemIds) {
  // Get all items
  const items = itemIds.map(id => db.invoiceItems[id]).filter(Boolean);
  
  if (items.length === 0) {
    throw new Error('No valid items to invoice');
  }
  
  // Calculate total
  const totalCents = items.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  // Create invoice with items in meta
  const invoice = await createInvoice({
    businessId,
    clientId,
    jobId: null, // Multiple jobs
    amountCents: totalCents,
    status: 'UNPAID',
    meta: {
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        amount: item.priceCents * item.quantity,
        date: item.date
      }))
    }
  });
  
  // Mark items as billed
  for (const item of items) {
    await markInvoiceItemBilled(item.id, invoice.id);
  }
  
  return invoice;
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
    createdAt: new Date().toISOString(),
    readStates: {
      client: message.senderRole === "client",
      business: message.senderRole === "business"
    }
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

function markBookingMessagesRead(businessId, bookingId, role) {
  const biz = db.businesses[businessId];
  if (!biz || !biz.messages) return;

  biz.messages.forEach((m) => {
    if (m.bookingId === bookingId) {
      if (!m.readStates) {
        m.readStates = { client: false, business: false };
      }
      m.readStates[role] = true;
    }
  });
}

function markInboxMessagesRead(businessId, clientId, role) {
  const biz = db.businesses[businessId];
  if (!biz || !biz.messages) return;

  biz.messages.forEach((m) => {
    if (!m.bookingId && m.clientId === clientId) {
      if (!m.readStates) {
        m.readStates = { client: false, business: false };
      }
      m.readStates[role] = true;
    }
  });
}

/* -------------------------------------------------------------------------- */
/*  FINANCIAL ANALYTICS HELPERS                                              */
/* -------------------------------------------------------------------------- */

// Get total revenue (all paid invoices)
function getTotalRevenue(businessId) {
  return Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID')
    .reduce((sum, i) => sum + (i.total || i.amountCents || 0), 0);
}

// Get revenue for a specific time period
function getRevenueByPeriod(businessId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID')
    .filter(i => {
      const invoiceDate = new Date(i.paidAt || i.createdAt);
      return invoiceDate >= start && invoiceDate <= end;
    })
    .reduce((sum, i) => sum + (i.total || i.amountCents || 0), 0);
}

// Get monthly revenue trend for the last N months
function getMonthlyRevenueTrend(businessId, months = 6) {
  const now = new Date();
  const trends = [];
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
    
    const revenue = Object.values(db.invoices)
      .filter(inv => inv.businessId === businessId && inv.status?.toUpperCase() === 'PAID')
      .filter(inv => {
        // Only use paidAt for paid invoices; fall back to createdAt only if paidAt is missing
        const paidDate = new Date(inv.paidAt || inv.createdAt);
        return paidDate >= monthStart && paidDate <= monthEnd;
      })
      .reduce((sum, inv) => sum + (inv.total || inv.amountCents || 0), 0);
    
    const bookingCount = Object.values(db.jobs)
      .filter(j => j.businessId === businessId && j.status === 'COMPLETED')
      .filter(j => {
        const jobDate = new Date(j.start);
        return jobDate >= monthStart && jobDate <= monthEnd;
      }).length;
    
    trends.push({
      month: monthDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      monthKey: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`,
      revenueCents: revenue,
      bookingCount
    });
  }
  
  return trends;
}

// Get revenue breakdown by service
function getRevenueByService(businessId) {
  const serviceRevenue = {};
  
  // Get all paid invoices
  const paidInvoices = Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID');
  
  // Aggregate by service from invoice items
  paidInvoices.forEach(invoice => {
    if (invoice.items && Array.isArray(invoice.items)) {
      invoice.items.forEach(item => {
        const service = db.services[item.serviceId];
        if (service) {
          if (!serviceRevenue[item.serviceId]) {
            serviceRevenue[item.serviceId] = {
              serviceId: item.serviceId,
              serviceName: service.name,
              revenueCents: 0,
              bookingCount: 0
            };
          }
          // Multiply by quantity to get correct revenue
          serviceRevenue[item.serviceId].revenueCents += (item.priceCents || 0) * (item.quantity || 1);
          serviceRevenue[item.serviceId].bookingCount += (item.quantity || 1);
        }
      });
    }
  });
  
  return Object.values(serviceRevenue).sort((a, b) => b.revenueCents - a.revenueCents);
}

// Get revenue breakdown by staff
function getRevenueByStaff(businessId) {
  const staffRevenue = {};
  
  // Get all completed jobs with staff assigned
  const completedJobs = Object.values(db.jobs)
    .filter(j => j.businessId === businessId && j.status === 'COMPLETED' && j.staffId);
  
  completedJobs.forEach(job => {
    const staff = db.users[job.staffId];
    if (staff) {
      if (!staffRevenue[job.staffId]) {
        staffRevenue[job.staffId] = {
          staffId: job.staffId,
          staffName: staff.name || staff.email,
          revenueCents: 0,
          bookingCount: 0
        };
      }
      staffRevenue[job.staffId].revenueCents += job.priceCents || 0;
      staffRevenue[job.staffId].bookingCount += 1;
    }
  });
  
  return Object.values(staffRevenue).sort((a, b) => b.revenueCents - a.revenueCents);
}

// Get revenue breakdown by client (top clients)
function getRevenueByClient(businessId, limit = 10) {
  const clientRevenue = {};
  
  // Get all paid invoices
  const paidInvoices = Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID');
  
  paidInvoices.forEach(invoice => {
    const client = db.clients[invoice.clientId];
    if (client) {
      if (!clientRevenue[invoice.clientId]) {
        clientRevenue[invoice.clientId] = {
          clientId: invoice.clientId,
          clientName: client.name,
          revenueCents: 0,
          invoiceCount: 0
        };
      }
      // Use total (which is already the sum of all items) to avoid double counting
      clientRevenue[invoice.clientId].revenueCents += invoice.total || invoice.amountCents || 0;
      clientRevenue[invoice.clientId].invoiceCount += 1;
    }
  });
  
  return Object.values(clientRevenue)
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}

// Calculate revenue forecast for next N days
function getRevenueForecast(businessId, days = 90) {
  // Calculate average daily revenue from last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const historicalRevenue = Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID')
    .filter(i => {
      const paidDate = new Date(i.paidAt || i.createdAt);
      return paidDate >= ninetyDaysAgo && paidDate <= now;
    })
    .reduce((sum, i) => sum + (i.total || i.amountCents || 0), 0);
  
  // Guard against division by zero
  const avgDailyRevenue = historicalRevenue > 0 ? historicalRevenue / 90 : 0;
  
  // Count scheduled bookings for forecast periods
  const scheduledRevenue30 = Object.values(db.jobs)
    .filter(j => j.businessId === businessId && j.status === 'BOOKED')
    .filter(j => {
      const jobDate = new Date(j.start);
      const thirtyDays = new Date(now);
      thirtyDays.setDate(thirtyDays.getDate() + 30);
      return jobDate >= now && jobDate <= thirtyDays;
    })
    .reduce((sum, j) => sum + (j.priceCents || 0), 0);
  
  const scheduledRevenue60 = Object.values(db.jobs)
    .filter(j => j.businessId === businessId && j.status === 'BOOKED')
    .filter(j => {
      const jobDate = new Date(j.start);
      const sixtyDays = new Date(now);
      sixtyDays.setDate(sixtyDays.getDate() + 60);
      return jobDate >= now && jobDate <= sixtyDays;
    })
    .reduce((sum, j) => sum + (j.priceCents || 0), 0);
  
  const scheduledRevenue90 = Object.values(db.jobs)
    .filter(j => j.businessId === businessId && j.status === 'BOOKED')
    .filter(j => {
      const jobDate = new Date(j.start);
      const ninetyDays = new Date(now);
      ninetyDays.setDate(ninetyDays.getDate() + 90);
      return jobDate >= now && jobDate <= ninetyDays;
    })
    .reduce((sum, j) => sum + (j.priceCents || 0), 0);
  
  // Ensure all values are valid numbers
  return {
    avgDailyRevenueCents: Math.round(avgDailyRevenue) || 0,
    forecast30Days: {
      scheduledRevenueCents: scheduledRevenue30 || 0,
      projectedRevenueCents: Math.round(avgDailyRevenue * 30) || 0,
      totalForecastCents: (scheduledRevenue30 || 0) + (Math.round(avgDailyRevenue * 30) || 0)
    },
    forecast60Days: {
      scheduledRevenueCents: scheduledRevenue60 || 0,
      projectedRevenueCents: Math.round(avgDailyRevenue * 60) || 0,
      totalForecastCents: (scheduledRevenue60 || 0) + (Math.round(avgDailyRevenue * 60) || 0)
    },
    forecast90Days: {
      scheduledRevenueCents: scheduledRevenue90 || 0,
      projectedRevenueCents: Math.round(avgDailyRevenue * 90) || 0,
      totalForecastCents: (scheduledRevenue90 || 0) + (Math.round(avgDailyRevenue * 90) || 0)
    }
  };
}

// Get financial overview KPIs
function getFinancialOverview(businessId) {
  const totalRevenueCents = getTotalRevenue(businessId);
  const paidInvoices = Object.values(db.invoices)
    .filter(i => i.businessId === businessId && i.status?.toUpperCase() === 'PAID');
  
  const completedJobs = Object.values(db.jobs)
    .filter(j => j.businessId === businessId && j.status === 'COMPLETED');
  
  const avgBookingValue = completedJobs.length > 0
    ? Math.round(totalRevenueCents / completedJobs.length)
    : 0;
  
  // Calculate month-over-month growth
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  const thisMonthRevenue = getRevenueByPeriod(businessId, thisMonthStart, now);
  const lastMonthRevenue = getRevenueByPeriod(businessId, lastMonthStart, lastMonthEnd);
  
  const monthlyGrowth = lastMonthRevenue > 0
    ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
    : 0;
  
  return {
    totalRevenueCents,
    avgBookingValueCents: avgBookingValue,
    totalInvoices: paidInvoices.length,
    totalBookings: completedJobs.length,
    monthlyGrowthPercent: Math.round(monthlyGrowth * 10) / 10,
    thisMonthRevenueCents: thisMonthRevenue,
    lastMonthRevenueCents: lastMonthRevenue
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
  markInvoiceSent,
  listInvoicesByBusiness,
  listInvoicesByClient,
  resendInvoice,

  createInvoiceItem,
  getInvoiceItem,
  listInvoiceItemsByBusiness,
  listInvoiceItemsByClient,
  markInvoiceItemBilled,
  generateInvoiceFromItems,

  recordCancellation,
  addJobUpdate,
  getJobFeed,

  addBusinessMessage,
  listMessagesForBooking,
  listMessagesForInbox,
  markBookingMessagesRead,
  markInboxMessagesRead,

  countUpcomingBookings,
  countPendingBookings,
  countClients,
  getRevenueForCurrentWeek,
  getUpcomingBookingsPreview,
  getBookingsForDate,

  getTotalRevenue,
  getRevenueByPeriod,
  getMonthlyRevenueTrend,
  getRevenueByService,
  getRevenueByStaff,
  getRevenueByClient,
  getRevenueForecast,
  getFinancialOverview
};

/* -------------------------------------------------------------------------- */
/*  STATS & DASHBOARD HELPERS                                                 */
/* -------------------------------------------------------------------------- */

async function countUpcomingBookings(businessId) {
  return Object.values(db.jobs).filter(
    j => j.businessId === businessId && j.status === 'BOOKED'
  ).length;
}

async function countPendingBookings(businessId) {
  return Object.values(db.jobs).filter(
    j => j.businessId === businessId && j.status === 'PENDING'
  ).length;
}

async function countClients(businessId) {
  return Object.values(db.clients).filter(
    c => c.businessId === businessId
  ).length;
}

async function getRevenueForCurrentWeek(businessId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  return Object.values(db.invoices)
    .filter(i => i.businessId === businessId)
    .filter(i => i.status && i.status.toUpperCase() === 'PAID')
    .filter(i => {
      const invoiceDate = new Date(i.createdAt);
      return invoiceDate >= weekStart;
    })
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);
}

async function getUpcomingBookingsPreview(businessId, limit = 5) {
  const now = new Date();
  
  const upcoming = Object.values(db.jobs)
    .filter(j => j.businessId === businessId)
    .filter(j => j.status === 'BOOKED')
    .filter(j => new Date(j.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, limit);

  // Enrich with client and service names
  return upcoming.map(job => {
    const client = db.clients[job.clientId];
    const service = db.services[job.serviceId];
    
    return {
      id: job.id,
      bookingId: job.id,
      clientName: client?.name || 'Unknown Client',
      serviceName: service?.name || 'Unknown Service',
      startTimeFormatted: new Date(job.start).toLocaleString('en-GB', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      start: job.start,
      status: job.status
    };
  });
}

async function getBookingsForDate(businessId, dateYMD) {
  return Object.values(db.jobs)
    .filter(b => b.businessId === businessId)
    .filter(b => b.start && b.start.split('T')[0] === dateYMD)
    .map(b => {
      const client = db.clients[b.clientId];
      const service = db.services[b.serviceId];
      
      return {
        bookingId: b.id,
        clientName: client?.name || 'Client',
        serviceName: service?.name || 'Service',
        start: b.start,
        startTimeFormatted: new Date(b.start).toLocaleString('en-GB', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        addressLine1: client?.addressLine1 || ''
      };
    });
}

export {
  createEmptyBusinessSettings,
  mergeBusinessSettings,

  createBusiness,
  getBusiness,
  updateBusiness,
  listBusinesses,
  updateBusinessSettings,
  getBusinessSettings,

  createClient,
  getClient,
  updateClient,
  listClientsByBusiness,

  createDog,
  getDog,
  updateDog,
  listDogsByClient,

  createUser,
  getUser,
  getUser as getUserById,
  getUserByEmail,
  listUsersByBusiness,
  listStaffByBusiness,
  listAllUsers,

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
  markInvoiceSent,
  listInvoicesByBusiness,
  listInvoicesByClient,
  resendInvoice,

  createInvoiceItem,
  getInvoiceItem,
  listInvoiceItemsByBusiness,
  listInvoiceItemsByClient,
  markInvoiceItemBilled,
  generateInvoiceFromItems,

  recordCancellation,
  addJobUpdate,
  getJobFeed,

  addBusinessMessage,
  listMessagesForBooking,
  listMessagesForInbox,
  markBookingMessagesRead,
  markInboxMessagesRead,

  countUpcomingBookings,
  countPendingBookings,
  countClients,
  getRevenueForCurrentWeek,
  getUpcomingBookingsPreview,
  getBookingsForDate,

  getTotalRevenue,
  getRevenueByPeriod,
  getMonthlyRevenueTrend,
  getRevenueByService,
  getRevenueByStaff,
  getRevenueByClient,
  getRevenueForecast,
  getFinancialOverview
};
