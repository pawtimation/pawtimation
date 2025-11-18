// store.js
// Central in-memory store for the Pawtimation CRM (multi-business, staff, clients, dogs, jobs, services, invoices).

export const db = {
  // Core CRM entities
  businesses: {},    // { [businessId]: { id, name, ownerUserId, settings } }
  users: {},         // { [userId]: { id, businessId, role: 'ADMIN'|'STAFF', name, email, phone } }
  clients: {},       // { [clientId]: { id, businessId, name, email, phone, address, notes, dogIds: [] } }
  dogs: {},          // { [dogId]: { id, clientId, name, breed, age, behaviour, notes } }
  services: {},      // { [serviceId]: { id, businessId, name, durationMinutes, priceCents, active } }
  jobs: {},          // { [jobId]: { ...see repo.createJob } }
  availability: {},  // { [staffId]: [ { day: 'MON', start: '09:00', end: '17:00' }, ... ] }
  invoices: {},      // { [invoiceId]: { id, jobId, businessId, clientId, amountCents, status, createdAt, paidAt } }
  recurringJobs: {}, // { [recurringId]: { id, businessId, clientId, staffId, serviceId, rule, active } }
  reports: {},       // { [businessId]: { ...aggregated metrics... } }

  // Kept for compatibility with existing utility code like digest & cancellations.
  bookings: {},      // mirror of jobs for now
  updates: {},       // job notes / walk reports
  cancellations: {}, // cancellation records
  // Legacy-ish buckets we simply leave empty (not used by the CRM, but safe to keep around).
  usersLegacy: {},
  pets: {},
  sitters: {},
  invites: {},
  agreements: {}
};
