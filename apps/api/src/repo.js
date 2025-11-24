// repo.js
// Repository layer for Pawtimation CRM.
// Multi-business, staff, clients, dogs, services, jobs, invoices, availability.
// Now using PostgreSQL via Drizzle ORM for persistence.

import bcrypt from 'bcryptjs';
import { db } from './store.js';  // Still needed for Phase 2+ entities (jobs, invoices, availability)
import { storage, withTransaction } from './storage.js';
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
      invoiceReminderMaxCount: 3,

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
/*  INVOICE HELPERS                                                           */
/* -------------------------------------------------------------------------- */

function isInvoiceOverdue(invoice) {
  if (invoice.paidAt) return false;
  if (!invoice.dueDate) return false;
  
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  
  return now > dueDate;
}

function getOverdueDays(invoice) {
  if (!isInvoiceOverdue(invoice)) return 0;
  
  const now = new Date();
  const dueDate = new Date(invoice.dueDate);
  const daysDiff = Math.floor((now - dueDate) / (1000 * 60 * 60 * 24));
  
  return daysDiff;
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
  
  const created = await storage.createBusiness(biz);
  return created;
}

async function getBusiness(id) {
  let biz = await storage.getBusiness(id);
  if (biz && !biz.messages) {
    biz.messages = [];
  }
  return biz;
}

async function updateBusiness(id, patch) {
  const existing = await getBusiness(id);
  if (!existing) return null;

  const next = { ...existing };

  if (patch.settings) {
    next.settings = mergeBusinessSettings(existing.settings, patch.settings);
  }

  for (const key of Object.keys(patch)) {
    if (key === 'settings') continue;
    next[key] = patch[key];
  }

  const updated = await storage.updateBusiness(id, next);
  return updated;
}

async function listBusinesses() {
  return await storage.getAllBusinesses();
}

async function getBusinessSettings(id) {
  const business = await storage.getBusiness(id);
  if (!business) return null;
  
  // Always merge with defaults to handle legacy businesses and ensure complete structure
  const defaults = createEmptyBusinessSettings();
  const existing = business.settings || {};
  const mergedSettings = mergeBusinessSettings(defaults, existing);
  
  // Update the business with merged settings if different
  if (JSON.stringify(business.settings) !== JSON.stringify(mergedSettings)) {
    await storage.updateBusiness(id, { settings: mergedSettings });
  }
  
  return mergedSettings;
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
    password: data.passHash || null,
    crmClientId: data.crmClientId || null
  };
  const created = await storage.createUser(user);
  // Keep legacy passHash field for compatibility
  created.passHash = created.password;
  created.isAdmin = data.isAdmin || false;
  return created;
}

async function getUser(id) {
  let user = await storage.getUser(id);
  if (user && user.password) user.passHash = user.password;
  return user;
}

async function getUserByEmail(email) {
  const emailLower = (email || '').toLowerCase();
  let user = await storage.getUserByEmail(emailLower);
  if (user && user.password) user.passHash = user.password;
  return user;
}

async function listUsersByBusiness(businessId) {
  const users = await storage.getUsersByBusiness(businessId);
  users.forEach(u => { if (u.password) u.passHash = u.password; });
  return users;
}

async function listStaffByBusiness(businessId) {
  const users = await listUsersByBusiness(businessId);
  return users.filter(u => u.role === 'STAFF');
}

async function listAllUsers() {
  const users = await storage.getAllUsers();
  users.forEach(u => { if (u.password) u.passHash = u.password; });
  return users;
}

/* -------------------------------------------------------------------------- */
/*  CLIENTS                                                                   */
/* -------------------------------------------------------------------------- */

async function createClient(data) {
  const id = data.id || ('c_' + nid());
  
  // Write directly to flat address fields (new schema)
  const client = {
    id,
    businessId: data.businessId,
    name: data.name || '',
    email: data.email || '',
    phone: data.phone || '',
    addressLine1: data.addressLine1 || '',
    city: data.city || '',
    postcode: data.postcode || '',
    accessNotes: data.accessNotes || '',
    lat: data.lat || null,
    lng: data.lng || null,
    emergencyName: data.emergencyName || '',
    emergencyPhone: data.emergencyPhone || '',
    vetDetails: data.vetDetails || '',
    notes: data.notes || '',
    profileComplete: data.profileComplete || false,
    onboardingStep: data.onboardingStep || 1,
    dogIds: data.dogIds || []
  };
  
  const created = await storage.createClient(client);
  return created;
}

async function getClient(id) {
  let client = await storage.getClient(id);
  if (!client) return null;
  
  // Provide both flat fields AND legacy JSON for backward compatibility
  // Prefer flat columns over JSON when available
  if (!client.address || Object.keys(client.address).length === 0) {
    client.address = {
      line1: client.addressLine1 || '',
      city: client.city || '',
      postcode: client.postcode || '',
      lat: client.lat || null,
      lng: client.lng || null
    };
  }
  
  if (!client.emergencyContact || Object.keys(client.emergencyContact).length === 0) {
    client.emergencyContact = {
      name: client.emergencyName || '',
      phone: client.emergencyPhone || ''
    };
  }
  
  // Also expose flat fields directly for new code
  client.addressLine1 = client.addressLine1 || client.address?.line1 || '';
  client.city = client.city || client.address?.city || '';
  client.postcode = client.postcode || client.address?.postcode || '';
  client.accessNotes = client.accessNotes || '';
  client.lat = client.lat || client.address?.lat || null;
  client.lng = client.lng || client.address?.lng || null;
  client.emergencyName = client.emergencyName || client.emergencyContact?.name || '';
  client.emergencyPhone = client.emergencyPhone || client.emergencyContact?.phone || '';
  
  return client;
}

async function updateClient(id, patch) {
  const existing = await getClient(id);
  if (!existing) return null;
  
  // Write to both flat columns AND JSON for full backward compatibility
  // Extract flat fields if they're provided
  if (patch.addressLine1 !== undefined || patch.city !== undefined || patch.postcode !== undefined || 
      patch.lat !== undefined || patch.lng !== undefined || patch.accessNotes !== undefined) {
    // Write to flat columns
    const updates = {
      ...patch,
      addressLine1: patch.addressLine1 !== undefined ? patch.addressLine1 : existing.addressLine1,
      city: patch.city !== undefined ? patch.city : existing.city,
      postcode: patch.postcode !== undefined ? patch.postcode : existing.postcode,
      accessNotes: patch.accessNotes !== undefined ? patch.accessNotes : existing.accessNotes,
      lat: patch.lat !== undefined ? patch.lat : existing.lat,
      lng: patch.lng !== undefined ? patch.lng : existing.lng
    };
    
    // Also update JSON for legacy compatibility
    updates.address = {
      line1: updates.addressLine1 || '',
      city: updates.city || '',
      postcode: updates.postcode || '',
      lat: updates.lat || null,
      lng: updates.lng || null
    };
    
    const updated = await storage.updateClient(id, updates);
    return getClient(id); // Re-fetch to get full DTO with both formats
  }
  
  if (patch.emergencyName !== undefined || patch.emergencyPhone !== undefined) {
    const updates = {
      ...patch,
      emergencyName: patch.emergencyName !== undefined ? patch.emergencyName : existing.emergencyName,
      emergencyPhone: patch.emergencyPhone !== undefined ? patch.emergencyPhone : existing.emergencyPhone
    };
    
    // Also update JSON for legacy compatibility
    updates.emergencyContact = {
      name: updates.emergencyName || '',
      phone: updates.emergencyPhone || ''
    };
    
    const updated = await storage.updateClient(id, updates);
    return getClient(id); // Re-fetch to get full DTO with both formats
  }
  
  // For other fields, just update normally
  const updated = await storage.updateClient(id, patch);
  return getClient(id); // Re-fetch to get full DTO
}

async function markClientProfileComplete(id) {
  return updateClient(id, {
    profileComplete: true,
    onboardingStep: 999
  });
}

async function listClientsByBusiness(businessId) {
  const clients = await storage.getClientsByBusiness(businessId);
  
  // Add compatibility layer to each client
  clients.forEach(client => {
    // Provide both flat fields AND legacy JSON for backward compatibility
    if (!client.address || Object.keys(client.address).length === 0) {
      client.address = {
        line1: client.addressLine1 || '',
        city: client.city || '',
        postcode: client.postcode || '',
        lat: client.lat || null,
        lng: client.lng || null
      };
    }
    
    if (!client.emergencyContact || Object.keys(client.emergencyContact).length === 0) {
      client.emergencyContact = {
        name: client.emergencyName || '',
        phone: client.emergencyPhone || ''
      };
    }
    
    // Also expose flat fields directly for new code
    client.addressLine1 = client.addressLine1 || client.address?.line1 || '';
    client.city = client.city || client.address?.city || '';
    client.postcode = client.postcode || client.address?.postcode || '';
    client.accessNotes = client.accessNotes || '';
    client.lat = client.lat || client.address?.lat || null;
    client.lng = client.lng || client.address?.lng || null;
    client.emergencyName = client.emergencyName || client.emergencyContact?.name || '';
    client.emergencyPhone = client.emergencyPhone || client.emergencyContact?.phone || '';
  });
  
  return clients;
}

/* -------------------------------------------------------------------------- */
/*  CLIENT INVITATIONS                                                        */
/* -------------------------------------------------------------------------- */

async function createClientInvite(data) {
  return await storage.createClientInvite(data);
}

async function getClientInvite(id) {
  return await storage.getClientInvite(id);
}

async function getClientInviteByToken(token) {
  return await storage.getClientInviteByToken(token);
}

async function listClientInvitesByBusiness(businessId) {
  return await storage.getClientInvitesByBusiness(businessId);
}

async function markClientInviteUsed(inviteId, clientId) {
  return await storage.updateClientInvite(inviteId, {
    usedAt: new Date(),
    usedByClientId: clientId
  });
}

/* -------------------------------------------------------------------------- */
/*  CLIENT AUTH                                                               */
/* -------------------------------------------------------------------------- */

async function registerClientUser({ businessId, name, email, password }) {
  if (!businessId) throw new Error('businessId is required');
  if (!email) throw new Error('email is required');
  if (!password) throw new Error('password is required');

  // Check if client already exists
  let client = await storage.getClientByEmailAndBusiness(email, businessId);

  if (client && client.passwordHash) {
    // Client already registered - reject to prevent account takeover
    throw new Error('Client already registered. Please use login instead.');
  }

  if (!client) {
    // Create new client with hashed password
    const passwordHash = await bcrypt.hash(password, 10);
    client = await createClient({
      businessId,
      name: name || email,
      email,
      phone: '',
      address: '',
      notes: ''
    });
    // Update with password hash
    await storage.updateClient(client.id, { passwordHash });
    client.passwordHash = passwordHash;
  } else {
    // Client exists but no password set - set it now
    const passwordHash = await bcrypt.hash(password, 10);
    await storage.updateClient(client.id, { passwordHash });
    client.passwordHash = passwordHash;
  }

  return client;
}

async function loginClientUser({ businessId, email, password }) {
  if (!businessId || !email || !password) return null;

  // Fetch client from database
  const client = await storage.getClientByEmailAndBusiness(email, businessId);
  
  if (!client || !client.passwordHash) {
    return null; // Client not found or not registered
  }

  // Verify password against hash
  const isValid = await bcrypt.compare(password, client.passwordHash);
  
  if (!isValid) {
    return null; // Invalid password
  }

  return client;
}

async function getClientById(id) {
  return await storage.getClient(id);
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
  
  const created = await storage.createDog(dog);

  // Update client's dogIds array in database
  if (created.clientId) {
    const client = await getClient(created.clientId);
    if (client && !client.dogIds.includes(id)) {
      client.dogIds.push(id);
      await updateClient(created.clientId, { dogIds: client.dogIds });
    }
  }

  return created;
}

async function getDog(id) {
  return await storage.getDog(id);
}

async function updateDog(id, patch) {
  const existing = await getDog(id);
  if (!existing) return null;
  return await storage.updateDog(id, patch);
}

async function listDogsByClient(clientId) {
  return await storage.getDogsByClient(clientId);
}

async function listDogsByBusiness(businessId) {
  const clients = await storage.getClientsByBusiness(businessId);
  const clientIds = clients.map(c => c.id);
  const allDogs = await storage.getDogsByClientIds(clientIds);
  return allDogs;
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
    active: data.active !== false
  };
  
  const created = await storage.createService(svc);
  // Add legacy fields for compatibility
  created.group = data.group || false;
  created.maxDogs = data.maxDogs || 1;
  created.allowClientBooking = data.allowClientBooking !== false;
  created.approvalRequired = data.approvalRequired || false;
  
  return created;
}

async function getService(id) {
  return await storage.getService(id);
}

async function updateService(id, patch) {
  const existing = await getService(id);
  if (!existing) return null;
  return await storage.updateService(id, patch);
}

async function listServicesByBusiness(businessId) {
  return await storage.getServicesByBusiness(businessId);
}

/* -------------------------------------------------------------------------- */
/*  AVAILABILITY                                                              */
/* -------------------------------------------------------------------------- */

async function setStaffAvailability(staffId, slots) {
  const slotsArray = Array.isArray(slots) ? slots : [];
  await storage.setAvailability(staffId, slotsArray);
  return slotsArray;
}

async function getStaffAvailability(staffId) {
  const availability = await storage.getAvailabilityByStaff(staffId);
  return availability || [];
}

async function saveStaffWeeklyAvailability(staffId, availability) {
  const staff = await storage.getUser(staffId);
  if (!staff) return null;
  return await storage.updateUser(staffId, {
    weeklyAvailability: availability
  });
}

async function getStaffWeeklyAvailability(staffId) {
  const staff = await storage.getUser(staffId);
  return staff?.weeklyAvailability || {};
}

async function saveStaffServices(staffId, serviceIds) {
  const staff = await storage.getUser(staffId);
  if (!staff) return null;
  const servicesArray = Array.isArray(serviceIds) ? serviceIds : [];
  return await storage.updateUser(staffId, {
    services: servicesArray
  });
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
  const svc = data.serviceId ? await getService(data.serviceId) : null;

  const start = data.start;
  let end = data.end;

  if (!end && svc && svc.durationMinutes) {
    const ms = new Date(start).getTime() + svc.durationMinutes * 60 * 1000;
    end = new Date(ms).toISOString();
  }

  const priceCents =
    data.priceCents ??
    (svc && typeof svc.priceCents === 'number' ? svc.priceCents : 0);

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
    priceCents,
    notes: data.notes || '',
    walkRoute: data.route || null,
    completedAt: null,
    cancelledAt: null,
    cancellationReason: null
  };

  const created = await storage.createJob(job);
  return created;
}

async function getJob(id) {
  return await storage.getJob(id);
}

async function updateJob(id, patch) {
  const existing = await getJob(id);
  if (!existing) return null;
  
  return await storage.updateJob(id, patch);
}

async function listJobsByBusiness(businessId) {
  return await storage.getJobsByBusiness(businessId);
}

async function listJobsByClient(clientId) {
  return await storage.getJobsByClient(clientId);
}

async function listJobsByStaffAndRange(staffId, startIso, endIso) {
  const jobs = await storage.getJobsByStaff(staffId);
  return jobs.filter(j => {
    if (!j.start || !j.end) return false;
    if (!BLOCKING_STATUSES.has(j.status || 'PENDING')) return false;
    return rangesOverlap(j.start, j.end, startIso, endIso);
  });
}

async function assignStaffToJob(jobId, staffId) {
  const job = await getJob(jobId);
  if (!job) return null;
  return await storage.updateJob(jobId, { staffId });
}

async function setJobStatus(jobId, status) {
  const job = await getJob(jobId);
  if (!job) return null;
  
  // Normalize old status variants
  if (status === 'COMPLETE') status = 'COMPLETED';
  
  const beforeStatus = job.status;
  
  // Update status with timestamp if completing or cancelling
  const updates = { status };
  if (status === 'COMPLETED' && beforeStatus !== 'COMPLETED') {
    updates.completedAt = new Date();
  }
  if (status === 'CANCELLED' && beforeStatus !== 'CANCELLED') {
    updates.cancelledAt = new Date();
  }
  
  const updated = await storage.updateJob(jobId, updates);
  
  // Auto-create invoice ITEM only on COMPLETED (and only if it wasn't already COMPLETED)
  if (status === 'COMPLETED' && beforeStatus !== 'COMPLETED') {
    const svc = await getService(job.serviceId);
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
  
  // BLUEPRINT RULE: When COMPLETED job is cancelled, void associated invoice_items
  if (status === 'CANCELLED' && beforeStatus === 'COMPLETED') {
    const allItems = await storage.getInvoiceItemsByBusiness(job.businessId);
    const jobItems = allItems.filter(item => item.jobId === jobId);
    
    for (const item of jobItems) {
      // Only void items that haven't been billed yet (PENDING items)
      // Already BILLED items stay as-is since invoice already exists
      if (item.status === 'PENDING') {
        await storage.updateInvoiceItem(item.id, { status: 'VOID' });
      }
    }
  }
  
  // Add priceCents back as runtime field
  if (updated) {
    const svc = await getService(updated.serviceId);
    updated.priceCents = svc?.priceCents || 0;
  }
  
  return updated;
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
    sentToClient: data.sentToClient || null,
    paidAt: data.paidAt || null,
    paymentMethod: data.paymentMethod || null,
    paymentUrl: `https://pay.stripe.com/link/${id}`, // stubbed
    meta: data.meta || {}
  };
  return await storage.createInvoice(inv);
}

async function getInvoice(id) {
  return await storage.getInvoice(id);
}

async function markInvoicePaid(id, paymentMethod = 'cash') {
  const invoice = await storage.getInvoice(id);
  if (!invoice) return null;
  return await storage.updateInvoice(id, {
    status: 'PAID',
    paidAt: isoNow(),
    paymentMethod
  });
}

async function markInvoiceSent(id) {
  const invoice = await storage.getInvoice(id);
  if (!invoice) return null;
  return await storage.updateInvoice(id, {
    sentToClient: isoNow()
  });
}

async function listInvoicesByBusiness(businessId) {
  return await storage.getInvoicesByBusiness(businessId);
}

async function listInvoicesByClient(clientId) {
  return await storage.getInvoicesByClient(clientId);
}

async function resendInvoice(id) {
  // Stub: In production, this would trigger an email notification
  // For now, we just verify the invoice exists
  const invoice = await storage.getInvoice(id);
  if (!invoice) return null;
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
    status: data.status || 'PENDING'
  };
  return await storage.createInvoiceItem(item);
}

async function getInvoiceItem(id) {
  return await storage.getInvoiceItem(id);
}

async function listInvoiceItemsByBusiness(businessId, status = null) {
  let items = await storage.getInvoiceItemsByBusiness(businessId);
  if (status) {
    items = items.filter(i => i.status === status);
  }
  return items;
}

async function listInvoiceItemsByClient(clientId, status = null) {
  let items = await storage.getInvoiceItemsByClient(clientId);
  if (status) {
    items = items.filter(i => i.status === status);
  }
  return items;
}

async function markInvoiceItemBilled(itemId, invoiceId) {
  const item = await getInvoiceItem(itemId);
  if (!item) return null;
  return await storage.updateInvoiceItem(itemId, {
    status: 'BILLED',
    invoiceId,
    billedAt: isoNow()
  });
}

async function generateInvoiceFromItems(businessId, clientId, itemIds) {
  // Get all items from database
  const items = await Promise.all(itemIds.map(id => getInvoiceItem(id)));
  const validItems = items.filter(Boolean);
  
  if (validItems.length === 0) {
    throw new Error('No valid items to invoice');
  }
  
  // Calculate total
  const totalCents = validItems.reduce((sum, item) => sum + (item.priceCents * item.quantity), 0);
  
  // Create invoice with items in meta
  const invoice = await createInvoice({
    businessId,
    clientId,
    jobId: null, // Multiple jobs
    amountCents: totalCents,
    status: 'UNPAID',
    meta: {
      items: validItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        amount: item.priceCents * item.quantity,
        date: item.date
      }))
    }
  });
  
  // Mark items as billed
  for (const item of validItems) {
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
async function getTotalRevenue(businessId) {
  const invoices = await storage.getInvoicesByBusiness(businessId);
  return invoices
    .filter(i => i.status?.toUpperCase() === 'PAID')
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);
}

// Get revenue for a specific time period
async function getRevenueByPeriod(businessId, startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const invoices = await storage.getInvoicesByBusiness(businessId);
  return invoices
    .filter(i => i.status?.toUpperCase() === 'PAID')
    .filter(i => {
      const invoiceDate = new Date(i.paidAt || i.createdAt);
      return invoiceDate >= start && invoiceDate <= end;
    })
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);
}

// Get monthly revenue trend for the last N months
async function getMonthlyRevenueTrend(businessId, months = 6) {
  const now = new Date();
  const trends = [];
  
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const jobs = await storage.getJobsByBusiness(businessId);
  
  for (let i = months - 1; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59);
    
    const revenue = invoices
      .filter(inv => inv.status?.toUpperCase() === 'PAID')
      .filter(inv => {
        // Only use paidAt for paid invoices; fall back to createdAt only if paidAt is missing
        const paidDate = new Date(inv.paidAt || inv.createdAt);
        return paidDate >= monthStart && paidDate <= monthEnd;
      })
      .reduce((sum, inv) => sum + (inv.amountCents || 0), 0);
    
    const bookingCount = jobs
      .filter(j => j.status === 'COMPLETED')
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
async function getRevenueByService(businessId) {
  const serviceRevenue = {};
  
  // Get all invoice items (which link to jobs, which link to services)
  const invoiceItems = await storage.getInvoiceItemsByBusiness(businessId);
  
  // Aggregate by service
  for (const item of invoiceItems) {
    if (item.status !== 'BILLED') continue; // Only count billed items
    if (!item.jobId) continue; // Skip items without job reference
    
    const job = await storage.getJob(item.jobId);
    if (!job || !job.serviceId) continue;
    
    const service = await storage.getService(job.serviceId);
    if (!service) continue;
    
    const serviceId = service.id;
    if (!serviceRevenue[serviceId]) {
      serviceRevenue[serviceId] = {
        serviceId,
        serviceName: service.name,
        revenueCents: 0,
        bookingCount: 0
      };
    }
    serviceRevenue[serviceId].revenueCents += (item.priceCents || 0) * (item.quantity || 1);
    serviceRevenue[serviceId].bookingCount += (item.quantity || 1);
  }
  
  return Object.values(serviceRevenue).sort((a, b) => b.revenueCents - a.revenueCents);
}

// Get revenue breakdown by staff
// BLUEPRINT RULE: Only BILLED invoice_items count as revenue, not COMPLETED jobs
async function getRevenueByStaff(businessId) {
  const staffRevenue = {};
  
  // BLUEPRINT RULE 10.3: Only count revenue from PAID invoices
  // Get all BILLED invoice items, then verify their parent invoice is PAID
  const invoiceItems = await storage.getInvoiceItemsByBusiness(businessId);
  const invoices = await storage.getInvoicesByBusiness(businessId);
  
  // Convert invoices to map for O(1) lookup performance
  const invoiceMap = new Map(invoices.map(inv => [inv.id, inv]));
  
  for (const item of invoiceItems) {
    if (item.status !== 'BILLED') continue; // Only count billed items
    if (!item.invoiceId) continue; // Must belong to an invoice
    if (!item.jobId) continue; // Skip items without job reference
    
    // CRITICAL: Verify parent invoice is PAID
    const invoice = invoiceMap.get(item.invoiceId);
    if (!invoice || !invoice.paidAt) continue; // Only count if invoice is paid
    
    const job = await storage.getJob(item.jobId);
    if (!job || !job.staffId) continue; // Skip if no staff assigned
    
    const staff = await storage.getUser(job.staffId);
    if (!staff) continue;
    
    const staffId = job.staffId;
    if (!staffRevenue[staffId]) {
      staffRevenue[staffId] = {
        staffId,
        staffName: staff.name || staff.email,
        revenueCents: 0,
        bookingCount: 0
      };
    }
    staffRevenue[staffId].revenueCents += (item.priceCents || 0) * (item.quantity || 1);
    staffRevenue[staffId].bookingCount += (item.quantity || 1);
  }
  
  return Object.values(staffRevenue).sort((a, b) => b.revenueCents - a.revenueCents);
}

// Get revenue breakdown by client (top clients)
async function getRevenueByClient(businessId, limit = 10) {
  const clientRevenue = {};
  
  // Get all paid invoices
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const paidInvoices = invoices.filter(i => i.status?.toUpperCase() === 'PAID');
  
  for (const invoice of paidInvoices) {
    const client = await storage.getClient(invoice.clientId);
    if (client) {
      if (!clientRevenue[invoice.clientId]) {
        clientRevenue[invoice.clientId] = {
          clientId: invoice.clientId,
          clientName: client.name,
          revenueCents: 0,
          invoiceCount: 0
        };
      }
      clientRevenue[invoice.clientId].revenueCents += invoice.amountCents || 0;
      clientRevenue[invoice.clientId].invoiceCount += 1;
    }
  }
  
  return Object.values(clientRevenue)
    .sort((a, b) => b.revenueCents - a.revenueCents)
    .slice(0, limit);
}

// Calculate revenue forecast for next N days
async function getRevenueForecast(businessId, days = 90) {
  // Calculate average daily revenue from last 90 days
  const now = new Date();
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const historicalRevenue = invoices
    .filter(i => i.status?.toUpperCase() === 'PAID')
    .filter(i => {
      const paidDate = new Date(i.paidAt || i.createdAt);
      return paidDate >= ninetyDaysAgo && paidDate <= now;
    })
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);
  
  // Guard against division by zero
  const avgDailyRevenue = historicalRevenue > 0 ? historicalRevenue / 90 : 0;
  
  // Count scheduled bookings for forecast periods
  const jobs = await storage.getJobsByBusiness(businessId);
  const bookedJobs = jobs.filter(j => j.status === 'BOOKED');
  
  const thirtyDays = new Date(now);
  thirtyDays.setDate(thirtyDays.getDate() + 30);
  const scheduledRevenue30 = bookedJobs
    .filter(j => {
      const jobDate = new Date(j.start);
      return jobDate >= now && jobDate <= thirtyDays;
    })
    .reduce((sum, j) => sum + (j.priceCents || 0), 0);
  
  const sixtyDays = new Date(now);
  sixtyDays.setDate(sixtyDays.getDate() + 60);
  const scheduledRevenue60 = bookedJobs
    .filter(j => {
      const jobDate = new Date(j.start);
      return jobDate >= now && jobDate <= sixtyDays;
    })
    .reduce((sum, j) => sum + (j.priceCents || 0), 0);
  
  const ninetyDays = new Date(now);
  ninetyDays.setDate(ninetyDays.getDate() + 90);
  const scheduledRevenue90 = bookedJobs
    .filter(j => {
      const jobDate = new Date(j.start);
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
async function getFinancialOverview(businessId) {
  const totalRevenueCents = await getTotalRevenue(businessId);
  
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const paidInvoices = invoices.filter(i => i.status?.toUpperCase() === 'PAID');
  
  const jobs = await storage.getJobsByBusiness(businessId);
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
  
  const avgBookingValue = completedJobs.length > 0
    ? Math.round(totalRevenueCents / completedJobs.length)
    : 0;
  
  // Calculate month-over-month growth
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
  
  const thisMonthRevenue = await getRevenueByPeriod(businessId, thisMonthStart, now);
  const lastMonthRevenue = await getRevenueByPeriod(businessId, lastMonthStart, lastMonthEnd);
  
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
  getUserByEmail,
  listUsersByBusiness,
  listStaffByBusiness,

  createClient,
  getClient,
  updateClient,
  markClientProfileComplete,
  listClientsByBusiness,

  createClientInvite,
  getClientInvite,
  getClientInviteByToken,
  listClientInvitesByBusiness,
  markClientInviteUsed,

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

  createRecurringJob,
  getRecurringJob,
  updateRecurringJob,
  listRecurringJobsByBusiness,
  createRecurringRuleWithJobs,

  countUpcomingBookings,
  countPendingBookings,
  countClients,
  getRevenueForCurrentWeek,
  getUpcomingBookingsPreview,
  getBookingsForDate,
  getTodayJobsStats,
  getWeekJobsStats,
  getActiveStaffStats,
  getNewClientsThisMonth,
  getRevenueLast7Days,
  getPaidThisMonth,
  getRecentActivity,
  getPendingActions,

  getTotalRevenue,
  getRevenueByPeriod,
  getMonthlyRevenueTrend,
  getRevenueByService,
  getRevenueByStaff,
  getRevenueByClient,
  getRevenueForecast,
  getFinancialOverview,

  // System logging
  createSystemLog: (data) => storage.logSystem(data)
};

/* -------------------------------------------------------------------------- */
/*  STATS & DASHBOARD HELPERS                                                 */
/* -------------------------------------------------------------------------- */

async function countUpcomingBookings(businessId) {
  const jobs = await storage.getJobsByBusiness(businessId);
  return jobs.filter(j => j.status === 'BOOKED').length;
}

async function countPendingBookings(businessId) {
  const jobs = await storage.getJobsByBusiness(businessId);
  return jobs.filter(j => j.status === 'PENDING').length;
}

async function countClients(businessId) {
  const clients = await storage.getClientsByBusiness(businessId);
  return clients.length;
}

async function getRevenueForCurrentWeek(businessId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);

  const invoices = await storage.getInvoicesByBusiness(businessId);
  return invoices
    .filter(i => i.status && i.status.toUpperCase() === 'PAID')
    .filter(i => {
      const invoiceDate = new Date(i.createdAt);
      return invoiceDate >= weekStart;
    })
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);
}

async function getUpcomingBookingsPreview(businessId, limit = 5) {
  const now = new Date();
  
  const jobs = await storage.getJobsByBusiness(businessId);
  const upcoming = jobs
    .filter(j => j.status === 'BOOKED')
    .filter(j => new Date(j.start) >= now)
    .sort((a, b) => new Date(a.start) - new Date(b.start))
    .slice(0, limit);

  // Enrich with client and service names
  const enriched = await Promise.all(upcoming.map(async job => {
    const client = await storage.getClient(job.clientId);
    const service = await storage.getService(job.serviceId);
    
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
  }));
  
  return enriched;
}

async function getBookingsForDate(businessId, dateYMD) {
  const jobs = await storage.getJobsByBusiness(businessId);
  const filtered = jobs.filter(b => {
    const startDate = new Date(b.start);
    const dateStr = startDate.toISOString().split('T')[0];
    return dateStr === dateYMD;
  });
  
  const enriched = await Promise.all(filtered.map(async b => {
    const client = await storage.getClient(b.clientId);
    const service = await storage.getService(b.serviceId);
    
    return {
      bookingId: b.id,
      clientName: client?.name || 'Client',
      serviceName: service?.name || 'Service',
      start: b.start,
      startTimeFormatted: new Date(b.start).toLocaleString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      addressLine1: client?.address?.addressLine1 || ''
    };
  }));
  
  return enriched;
}

async function getTodayJobsStats(businessId) {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const jobs = await storage.getJobsByBusiness(businessId);
  const todayJobs = jobs.filter(j => {
    const jobStart = new Date(j.start);
    return jobStart >= todayStart && jobStart <= todayEnd && j.status !== 'CANCELLED';
  });

  const completed = todayJobs.filter(j => j.status === 'COMPLETED').length;
  const upcoming = todayJobs.filter(j => j.status === 'BOOKED' || j.status === 'IN_PROGRESS').length;

  return {
    total: todayJobs.length,
    completed,
    upcoming
  };
}

async function getWeekJobsStats(businessId) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  // Get last week for comparison
  const lastWeekStart = new Date(weekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekStart);

  const jobs = await storage.getJobsByBusiness(businessId);
  
  const thisWeekJobs = jobs.filter(j => {
    const jobStart = new Date(j.start);
    return jobStart >= weekStart && jobStart < weekEnd && j.status !== 'CANCELLED';
  });

  const lastWeekJobs = jobs.filter(j => {
    const jobStart = new Date(j.start);
    return jobStart >= lastWeekStart && jobStart < lastWeekEnd && j.status !== 'CANCELLED';
  });

  return {
    total: thisWeekJobs.length,
    change: thisWeekJobs.length - lastWeekJobs.length,
    lastWeek: lastWeekJobs.length
  };
}

async function getActiveStaffStats(businessId) {
  const users = await storage.getUsersByBusiness(businessId);
  const staff = users.filter(u => u.role === 'staff');
  
  // Count staff who have any availability records (active staff)
  let activeCount = 0;
  for (const s of staff) {
    const staffAvail = await storage.getAvailabilityByStaff(s.id);
    // Staff is active if they have any availability records
    if (staffAvail && staffAvail.length > 0) {
      activeCount++;
    }
  }

  return {
    active: activeCount,
    total: staff.length
  };
}

async function getNewClientsThisMonth(businessId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const clients = await storage.getClientsByBusiness(businessId);
  const newClients = clients.filter(c => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= monthStart;
  });

  return newClients.length;
}

async function getRevenueLast7Days(businessId) {
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  // Previous 7 days for comparison
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(now.getDate() - 14);
  fourteenDaysAgo.setHours(0, 0, 0, 0);

  const invoices = await storage.getInvoicesByBusiness(businessId);
  
  const last7Days = invoices
    .filter(i => i.paidAt && new Date(i.paidAt) >= sevenDaysAgo)
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);

  const previous7Days = invoices
    .filter(i => i.paidAt && new Date(i.paidAt) >= fourteenDaysAgo && new Date(i.paidAt) < sevenDaysAgo)
    .reduce((sum, i) => sum + (i.amountCents || 0), 0);

  return {
    totalCents: last7Days,
    change: last7Days - previous7Days,
    previousPeriodCents: previous7Days
  };
}

async function getPaidThisMonth(businessId) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const invoices = await storage.getInvoicesByBusiness(businessId);
  const paidThisMonth = invoices.filter(i => {
    if (!i.paidAt) return false;
    const paidDate = new Date(i.paidAt);
    return paidDate >= monthStart;
  });

  return {
    totalCents: paidThisMonth.reduce((sum, i) => sum + (i.amountCents || 0), 0),
    count: paidThisMonth.length
  };
}

async function getRecentActivity(businessId, limit = 10) {
  const jobs = await storage.getJobsByBusiness(businessId);
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const clients = await storage.getClientsByBusiness(businessId);
  const users = await storage.getUsersByBusiness(businessId);

  const activity = [];

  // New bookings (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  jobs
    .filter(j => new Date(j.createdAt) >= sevenDaysAgo)
    .forEach(j => {
      const client = clients.find(c => c.id === j.clientId);
      activity.push({
        type: 'booking',
        timestamp: j.createdAt,
        message: `New booking created for ${client?.name || 'Unknown Client'}`,
        details: j.status
      });
    });

  // Payments received
  invoices
    .filter(i => i.paidAt && new Date(i.paidAt) >= sevenDaysAgo)
    .forEach(i => {
      const client = clients.find(c => c.id === i.clientId);
      activity.push({
        type: 'payment',
        timestamp: i.paidAt,
        message: `Payment received from ${client?.name || 'Unknown Client'}`,
        details: `£${((i.amountCents || 0) / 100).toFixed(2)}`
      });
    });

  // New clients
  clients
    .filter(c => new Date(c.createdAt) >= sevenDaysAgo)
    .forEach(c => {
      activity.push({
        type: 'client',
        timestamp: c.createdAt,
        message: `New client added: ${c.name}`,
        details: ''
      });
    });

  // Sort by timestamp and limit
  return activity
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
}

async function getPendingActions(businessId) {
  const jobs = await storage.getJobsByBusiness(businessId);
  const invoices = await storage.getInvoicesByBusiness(businessId);
  const clients = await storage.getClientsByBusiness(businessId);
  const users = await storage.getUsersByBusiness(businessId);

  const actions = [];
  const now = new Date();

  // Overdue invoices
  const overdueInvoices = invoices.filter(i => {
    if (i.paidAt || !i.dueDate) return false;
    const dueDate = new Date(i.dueDate);
    return dueDate < now;
  });

  if (overdueInvoices.length > 0) {
    actions.push({
      type: 'overdue_invoices',
      count: overdueInvoices.length,
      message: `${overdueInvoices.length} invoice${overdueInvoices.length > 1 ? 's' : ''} overdue`,
      link: '/admin/invoices'
    });
  }

  // Pending bookings
  const pendingBookings = jobs.filter(j => j.status === 'PENDING');
  if (pendingBookings.length > 0) {
    actions.push({
      type: 'pending_bookings',
      count: pendingBookings.length,
      message: `${pendingBookings.length} booking${pendingBookings.length > 1 ? 's' : ''} awaiting approval`,
      link: '/admin/bookings?filter=pending'
    });
  }

  // Clients with missing details (no address)
  const incompleteClients = clients.filter(c => !c.address || !c.address.addressLine1);
  if (incompleteClients.length > 0) {
    actions.push({
      type: 'incomplete_clients',
      count: incompleteClients.length,
      message: `${incompleteClients.length} client${incompleteClients.length > 1 ? 's' : ''} missing address details`,
      link: '/admin/clients'
    });
  }

  // Staff without availability
  const staff = users.filter(u => u.role === 'staff');
  
  const staffWithoutAvail = [];
  for (const s of staff) {
    const staffAvail = await storage.getAvailabilityByStaff(s.id);
    // Staff without availability if they have no availability records
    if (!staffAvail || staffAvail.length === 0) {
      staffWithoutAvail.push(s);
    }
  }

  if (staffWithoutAvail.length > 0) {
    actions.push({
      type: 'staff_no_availability',
      count: staffWithoutAvail.length,
      message: `${staffWithoutAvail.length} staff member${staffWithoutAvail.length > 1 ? 's' : ''} without availability`,
      link: '/admin/staff'
    });
  }

  return actions;
}

/* -------------------------------------------------------------------------- */
/*  RECURRING JOBS                                                            */
/* -------------------------------------------------------------------------- */

async function createRecurringJob(data) {
  const id = data.id || `rj_${nid()}`;
  const recurringJob = await storage.createRecurringJob({
    ...data,
    id,
  });
  return recurringJob;
}

async function getRecurringJob(id) {
  return await storage.getRecurringJob(id);
}

async function updateRecurringJob(id, updates) {
  return await storage.updateRecurringJob(id, updates);
}

async function listRecurringJobsByBusiness(businessId) {
  return await storage.getRecurringJobsByBusiness(businessId);
}

async function createRecurringRuleWithJobs(ruleData, jobsData) {
  const ruleId = ruleData.id || `rj_${nid()}`;
  const ruleWithId = { ...ruleData, id: ruleId };
  
  const jobsWithIds = jobsData.map(jobData => ({
    ...jobData,
    id: jobData.id || `j_${nid()}`,
  }));
  
  return await storage.createRecurringRuleWithJobs(ruleWithId, jobsWithIds);
}

/* -------------------------------------------------------------------------- */
/*  DATA INTEGRITY & REPAIR                                                   */
/* -------------------------------------------------------------------------- */

// BLUEPRINT RULE 10.3: Find and repair orphaned invoice_items
// Finds COMPLETED jobs without invoice_items and creates them
async function repairOrphanedInvoiceItems(businessId) {
  const jobs = await storage.getJobsByBusiness(businessId);
  const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
  const allItems = await storage.getInvoiceItemsByBusiness(businessId);
  
  const orphanedJobs = [];
  const repairedItems = [];
  
  for (const job of completedJobs) {
    const hasItem = allItems.some(item => item.jobId === job.id);
    if (!hasItem) {
      orphanedJobs.push(job);
      
      // Create missing invoice item
      const svc = await getService(job.serviceId);
      const amount = job.priceCents || svc?.priceCents || 0;
      const jobDate = new Date(job.start);
      const dateStr = jobDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const description = `${svc?.name || 'Service'} (${dateStr}) [REPAIRED]`;
      
      const item = await createInvoiceItem({
        jobId: job.id,
        clientId: job.clientId,
        businessId: job.businessId,
        description,
        quantity: 1,
        priceCents: amount,
        date: job.start,
        status: 'PENDING'
      });
      
      repairedItems.push(item);
    }
  }
  
  return {
    orphanedJobs: orphanedJobs.length,
    repairedItems: repairedItems.length,
    jobs: orphanedJobs,
    items: repairedItems
  };
}

// Find unbilled invoice items (PENDING items not attached to invoices)
async function findUnbilledInvoiceItems(businessId) {
  const allItems = await storage.getInvoiceItemsByBusiness(businessId);
  return allItems.filter(item => item.status === 'PENDING' && !item.invoiceId);
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
  listDogsByBusiness,

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

  isInvoiceOverdue,
  getOverdueDays,
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

  createRecurringJob,
  getRecurringJob,
  updateRecurringJob,
  listRecurringJobsByBusiness,
  createRecurringRuleWithJobs,

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
  getFinancialOverview,

  repairOrphanedInvoiceItems,
  findUnbilledInvoiceItems
};
export { logSystem, getReferralsByReferrer, getSystemLogs } from './storage.js';
