// repo.js
// Repository layer for Pawtimation CRM.
// Multi-business, staff, clients, dogs, services, jobs, invoices, availability.
// Includes legacy-compatible methods so existing code can still run while you pivot.

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
      brandingColor: '#16a34a',
      defaultServicesCreated: false
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

  if (user.role === 'STAFF') {
    db.sitters[id] = { id, userId: id, name: user.name, email: user.email };
  }

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
/*  DOGS (formerly pets)                                                      */
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
/*  JOBS (core CRM "booking" entity)                                          */
/* -------------------------------------------------------------------------- */

function rangesOverlap(startA, endA, startB, endB) {
  const aStart = new Date(startA).getTime();
  const aEnd = new Date(endA).getTime();
  const bStart = new Date(startB).getTime();
  const bEnd = new Date(endB).getTime();
  return aStart < bEnd && bStart < aEnd;
}

function enrichJobForLegacyBooking(job) {
  const client = job.clientId ? db.clients[job.clientId] : null;
  const staff = job.staffId ? (db.sitters[job.staffId] || db.users[job.staffId]) : null;
  const dogList = job.dogIds ? job.dogIds.map(dogId => db.dogs[dogId]).filter(d => d) : [];
  const firstDog = dogList[0];

  return {
    ...job,
    ownerEmail: client?.email || '',
    sitterId: job.staffId || '',
    sitterName: staff?.name || '',
    petName: firstDog?.name || '',
    total: job.priceCents || 0,
    ratePerDay: job.priceCents || 0,
    startDate: job.start || '',
    endDate: job.end || ''
  };
}

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
  db.bookings[id] = enrichJobForLegacyBooking(job);

  return job;
}

async function getJob(id) {
  return db.jobs[id] || null;
}

async function updateJob(id, patch) {
  if (!db.jobs[id]) return null;
  db.jobs[id] = { ...db.jobs[id], ...patch, updatedAt: isoNow() };
  db.bookings[id] = enrichJobForLegacyBooking(db.jobs[id]);
  return db.jobs[id];
}

async function listJobsByBusiness(businessId) {
  return Object.values(db.jobs).filter(j => j.businessId === businessId);
}

async function listJobsByStaffAndRange(staffId, startIso, endIso) {
  return Object.values(db.jobs).filter(j => {
    if (j.staffId !== staffId) return false;
    if (!j.start || !j.end) return false;
    return rangesOverlap(j.start, j.end, startIso, endIso);
  });
}

async function assignStaffToJob(jobId, staffId) {
  if (!db.jobs[jobId]) return null;
  db.jobs[jobId].staffId = staffId;
  db.jobs[jobId].updatedAt = isoNow();
  db.bookings[jobId] = enrichJobForLegacyBooking(db.jobs[jobId]);
  return db.jobs[jobId];
}

async function setJobStatus(jobId, status) {
  if (!db.jobs[jobId]) return null;
  db.jobs[jobId].status = status;
  db.jobs[jobId].updatedAt = isoNow();
  db.bookings[jobId] = enrichJobForLegacyBooking(db.jobs[jobId]);
  return db.jobs[jobId];
}

/* -------------------------------------------------------------------------- */
/*  SIMPLE AVAILABILITY CHECK (for future manager view)                       */
/* -------------------------------------------------------------------------- */

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
/*  CANCELLATIONS (still useful for CRM)                                      */
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
/*  LEGACY-COMPATIBILITY METHODS (TEMPORARY SHIMS)                            */
/* -------------------------------------------------------------------------- */

async function createInvite(data) {
  const id = nid();
  db.invites[id] = { id, ...data };
  return db.invites[id];
}

async function getInvite(id) {
  return db.invites[id] || null;
}

async function setInviteStatus(id, status) {
  if (db.invites[id]) db.invites[id].status = status;
  return db.invites[id] || null;
}

async function createBooking(data) {
  if (data.sitterId) {
    const sitter = db.sitters[data.sitterId];
    if (sitter && sitter.suspended) {
      throw new Error('Cannot create booking: Companion is suspended');
    }
  }
  const id = nid();
  db.bookings[id] = { id, ...data };
  db.updates[id] = [];
  return db.bookings[id];
}

async function getBooking(id) {
  return db.bookings[id] || db.jobs[id] || null;
}

async function addUpdate(jobId, upd) {
  db.updates[jobId] = db.updates[jobId] || [];
  db.updates[jobId].push(upd);
  return upd;
}

async function getFeed(jobId) {
  return {
    booking: db.bookings[jobId] || db.jobs[jobId] || null,
    updates: db.updates[jobId] || []
  };
}

async function getSitterById(id) {
  return db.sitters[id] || null;
}

async function upsertSitter(p) {
  const id = p.id || p.userId || ('u_' + nid());
  const user = db.users[id] || {
    id,
    businessId: p.businessId || null,
    role: 'STAFF',
    name: p.name || '',
    email: p.email || ''
  };
  db.users[id] = { ...user, ...p, role: 'STAFF' };
  db.sitters[id] = { ...(db.sitters[id] || {}), id, ...p };
  return db.sitters[id];
}

async function updateSitterTier(id, tier) {
  if (!db.sitters[id]) return null;
  db.sitters[id].tier = tier;
  return db.sitters[id];
}

async function getReferencesBySitterId() {
  return [];
}

async function getSitterAgreements(sid) {
  return Object.values(db.agreements).filter(a => a.sitterId === sid);
}

async function addSitterAgreement(a) {
  const id = a.id || ('agr_' + nid());
  db.agreements[id] = { id, ...a };
  return db.agreements[id];
}

async function setBookingStatus(id, status) {
  if (db.bookings[id]) db.bookings[id].status = status;
  if (db.jobs[id]) {
    db.jobs[id].status = status;
    db.jobs[id].updatedAt = isoNow();
  }
  return db.bookings[id] || db.jobs[id] || null;
}

async function markBookingPaid(id, escrowId) {
  if (db.bookings[id]) db.bookings[id].escrowId = escrowId;
  if (db.jobs[id]) {
    db.jobs[id].escrowId = escrowId;
    db.jobs[id].updatedAt = isoNow();
    db.bookings[id] = enrichJobForLegacyBooking(db.jobs[id]);
  }
  return db.bookings[id] || db.jobs[id] || null;
}

async function setAvailability(userId, dates) {
  db.availability[userId] = dates;
  return dates;
}

async function getAvailability(userId) {
  return db.availability[userId] || [];
}

async function createBookingRequest(data) {
  const id = nid();
  db.bookingRequests[id] = { id, ...data, createdAt: isoNow() };
  return db.bookingRequests[id];
}

async function getBookingRequest(id) {
  return db.bookingRequests[id] || null;
}

async function getAllSitters() {
  return Object.values(db.sitters);
}

async function setOwnerPreference(ownerEmail, sitterId, preference) {
  if (!db.ownerPreferences[ownerEmail]) db.ownerPreferences[ownerEmail] = {};
  db.ownerPreferences[ownerEmail][sitterId] = { ...preference, updatedAt: isoNow() };
  return db.ownerPreferences[ownerEmail][sitterId];
}

async function getOwnerPreferences(ownerEmail) {
  return db.ownerPreferences[ownerEmail] || {};
}

async function hasOwnerPawedSitter(ownerEmail, sitterId) {
  return db.ownerPreferences[ownerEmail]?.[sitterId]?.pawed === true;
}

async function createIncident(data) {
  const id = 'inc_' + nid();
  db.incidents[id] = {
    id,
    ...data,
    status: 'NEW',
    createdAt: isoNow(),
    updatedAt: isoNow()
  };
  return db.incidents[id];
}

async function getIncident(id) {
  return db.incidents[id] || null;
}

async function getAllIncidents() {
  return Object.values(db.incidents);
}

async function updateIncidentStatus(id, status, reviewNotes) {
  if (!db.incidents[id]) return null;
  db.incidents[id].status = status;
  db.incidents[id].reviewNotes = reviewNotes;
  db.incidents[id].reviewedAt = isoNow();
  db.incidents[id].updatedAt = isoNow();
  return db.incidents[id];
}

async function addStrike(sitterId, incidentId, reason) {
  const id = 'strike_' + nid();
  db.strikes[id] = {
    id,
    sitterId,
    incidentId,
    reason,
    issuedAt: isoNow()
  };
  if (db.sitters[sitterId]) {
    db.sitters[sitterId].suspended = true;
    db.sitters[sitterId].suspensionReason = reason;
    db.sitters[sitterId].suspendedAt = isoNow();
  }
  return db.strikes[id];
}

async function getSitterStrikes(sitterId) {
  return Object.values(db.strikes).filter(s => s.sitterId === sitterId);
}

async function isSitterSuspended(sitterId) {
  return db.sitters[sitterId]?.suspended === true;
}

async function getBookingCountByOwner(ownerEmail) {
  return Object.values(db.bookings).filter(b => b.ownerEmail === ownerEmail && b.status === 'COMPLETED').length;
}

async function getBookingCountBySitter(sitterId) {
  return Object.values(db.bookings).filter(b => b.sitterId === sitterId && b.status === 'COMPLETED').length;
}

async function getRevenueByOwner(ownerEmail) {
  const completedBookings = Object.values(db.bookings).filter(b => b.ownerEmail === ownerEmail && b.status === 'COMPLETED');
  return completedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
}

async function getRevenueBySitter(sitterId) {
  const completedBookings = Object.values(db.bookings).filter(b => b.sitterId === sitterId && b.status === 'COMPLETED');
  return completedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
}

async function checkAndCreateMilestone(userId, userType) {
  if (db.milestones[userId]) return db.milestones[userId];

  let completedBookings = 0;
  let revenueGenerated = 0;

  if (userType === 'OWNER') {
    completedBookings = await getBookingCountByOwner(userId);
    revenueGenerated = await getRevenueByOwner(userId);
  } else if (userType === 'COMPANION') {
    completedBookings = await getBookingCountBySitter(userId);
    revenueGenerated = await getRevenueBySitter(userId);
  }

  const revenueInPounds = revenueGenerated / 100;

  if (completedBookings >= 10 && revenueInPounds >= 500 && !db.milestones[userId]) {
    const milestone = {
      id: 'milestone_' + nid(),
      userId,
      userType,
      milestoneType: '10_BOOKINGS_500_REVENUE',
      achievedAt: isoNow(),
      rewardSent: false,
      rewardValue: 30,
      bookingCount: completedBookings,
      revenueGenerated: revenueInPounds
    };
    db.milestones[userId] = milestone;
    return milestone;
  }
  return null;
}

async function getMilestone(userId) {
  return db.milestones[userId] || null;
}

async function getPendingRewards() {
  return Object.values(db.milestones).filter(m => !m.rewardSent);
}

async function markRewardSent(userId, trackingInfo) {
  if (db.milestones[userId]) {
    db.milestones[userId].rewardSent = true;
    db.milestones[userId].sentAt = isoNow();
    db.milestones[userId].trackingInfo = trackingInfo;
    return db.milestones[userId];
  }
  return null;
}

async function setAddress(userId, addressData) {
  db.addresses[userId] = {
    userId,
    ...addressData,
    updatedAt: isoNow()
  };
  return db.addresses[userId];
}

async function getAddress(userId) {
  return db.addresses[userId] || null;
}

async function getOwner(email) {
  return db.owners[email] || null;
}

async function upsertOwner(data) {
  const email = data.email;
  db.owners[email] = { ...(db.owners[email] || {}), ...data };
  return db.owners[email];
}

async function setOwnerFlag(email, flagName, value) {
  if (!db.owners[email]) {
    db.owners[email] = { email };
  }
  db.owners[email][flagName] = value;
  return db.owners[email];
}

/* -------------------------------------------------------------------------- */
/*  EXPORT                                                                    */
/* -------------------------------------------------------------------------- */

export const repo = {
  db,

  createBusiness,
  getBusiness,
  updateBusiness,

  createUser,
  getUser,
  listUsersByBusiness,
  listStaffByBusiness,

  createClient,
  getClient,
  listClientsByBusiness,

  createDog,
  getDog,
  listDogsByClient,

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

  createInvite,
  getInvite,
  setInviteStatus,
  createBooking,
  getBooking,
  addUpdate,
  getFeed,
  getSitterById,
  upsertSitter,
  updateSitterTier,
  getReferencesBySitterId,
  getSitterAgreements,
  addSitterAgreement,
  setBookingStatus,
  markBookingPaid,
  setAvailability,
  getAvailability,
  createBookingRequest,
  getBookingRequest,
  getAllSitters,
  setOwnerPreference,
  getOwnerPreferences,
  hasOwnerPawedSitter,
  createIncident,
  getIncident,
  getAllIncidents,
  updateIncidentStatus,
  addStrike,
  getSitterStrikes,
  isSitterSuspended,
  getBookingCountByOwner,
  getBookingCountBySitter,
  getRevenueByOwner,
  getRevenueBySitter,
  checkAndCreateMilestone,
  getMilestone,
  getPendingRewards,
  markRewardSent,
  setAddress,
  getAddress,
  getOwner,
  upsertOwner,
  setOwnerFlag
};
