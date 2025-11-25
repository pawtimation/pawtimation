// shared/schema.ts
// Drizzle ORM schema for Pawtimation CRM - Matches in-memory store.js structure exactly

import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, serial, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const businesses = pgTable('businesses', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  ownerUserId: varchar('owner_user_id'),
  settings: jsonb('settings').notNull(),
  plan: varchar('plan').default('FREE'),
  planStatus: varchar('plan_status').default('TRIAL'),
  planBillingCycle: varchar('plan_billing_cycle').default('MONTHLY'),
  trialStartedAt: timestamp('trial_started_at'),
  trialEndsAt: timestamp('trial_ends_at'),
  paidAt: timestamp('paid_at'),
  paidUntil: timestamp('paid_until'),
  isPlanLocked: boolean('is_plan_locked').default(false),
  suspensionReason: text('suspension_reason'),
  gracePeriodEnd: timestamp('grace_period_end'),
  gracePeriod24hReminderSentAt: timestamp('grace_period_24h_reminder_sent_at'),
  gracePeriodFinalNoticeSentAt: timestamp('grace_period_final_notice_sent_at'),
  paymentFailureCount: integer('payment_failure_count').default(0),
  lastPaymentFailureAt: timestamp('last_payment_failure_at'),
  stripeCustomerId: varchar('stripe_customer_id'),
  stripeConnectedAccountId: varchar('stripe_connected_account_id'),
  stripeConnectedAccountIdEncrypted: text('stripe_connected_account_id_encrypted'), // AES-256-GCM encrypted Stripe account ID
  stripeOnboardingComplete: boolean('stripe_onboarding_complete').default(false),
  betaTesterId: varchar('beta_tester_id'),
  planType: varchar('plan_type').default('STANDARD'),
  lockedPrice: integer('locked_price'),
  billingStartDate: timestamp('billing_start_date'),
  referralCode: varchar('referral_code'),
  referralCreditMonths: integer('referral_credit_months').default(0),
  referredByBusinessId: varchar('referred_by_business_id'),
  referralSignupsCount: integer('referral_signups_count').default(0),
  referralCreditsCents: integer('referral_credits_cents').default(0),
  betaActivatedAt: timestamp('beta_activated_at'),
  betaNotes: text('beta_notes'),
  betaStartedAt: timestamp('beta_started_at'),
  betaEndsAt: timestamp('beta_ends_at'),
  onboardingSteps: jsonb('onboarding_steps').default({}),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  role: varchar('role').notNull(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  phone: varchar('phone'),
  password: varchar('password'),
  crmClientId: varchar('crm_client_id'),
  address: jsonb('address'),
  emergencyContact: jsonb('emergency_contact'),
  bio: text('bio'),
  yearsExperience: integer('years_experience'),
  skills: jsonb('skills'),
  weeklyAvailability: jsonb('weekly_availability'),
  services: jsonb('services'),
  isWalker: boolean('is_walker').default(false),
  requirePasswordReset: boolean('require_password_reset').default(false),
  hasSeenWelcomeModal: boolean('has_seen_welcome_modal').default(false),
  mfaSecret: text('mfa_secret'),
  mfaEnabled: boolean('mfa_enabled').default(false),
  mfaBackupCodes: jsonb('mfa_backup_codes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_business_id_idx').on(table.businessId),
]);

export const clients = pgTable('clients', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  email: varchar('email'),
  phone: varchar('phone'),
  address: jsonb('address'),
  addressLine1: text('address_line1'),
  city: varchar('city'),
  postcode: varchar('postcode'),
  accessNotes: text('access_notes'),
  lat: text('lat'),
  lng: text('lng'),
  notes: text('notes'),
  vetDetails: text('vet_details'),
  emergencyContact: jsonb('emergency_contact'),
  emergencyName: varchar('emergency_name'),
  emergencyPhone: varchar('emergency_phone'),
  dogIds: jsonb('dog_ids'),
  passwordHash: varchar('password_hash'),
  profileComplete: boolean('profile_complete').default(false).notNull(),
  onboardingStep: integer('onboarding_step').default(1),
  hasSeenWelcomeModal: boolean('has_seen_welcome_modal').default(false),
  isActive: boolean('is_active').default(true).notNull(),
  deactivatedAt: timestamp('deactivated_at'),
  reactivationExpiresAt: timestamp('reactivation_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('clients_business_id_idx').on(table.businessId),
  index('clients_email_idx').on(table.email),
]);

export const clientInvites = pgTable('client_invites', {
  id: varchar('id').primaryKey(),
  token: varchar('token').notNull().unique(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  email: varchar('email').notNull(),
  name: varchar('name'),
  expiresAt: timestamp('expires_at').notNull(),
  createdBy: varchar('created_by').references(() => users.id, { onDelete: 'set null' }),
  usedAt: timestamp('used_at'),
  usedByClientId: varchar('used_by_client_id').references(() => clients.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('client_invites_token_idx').on(table.token),
  index('client_invites_business_id_idx').on(table.businessId),
]);

export const dogs = pgTable('dogs', {
  id: varchar('id').primaryKey(),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  breed: varchar('breed'),
  age: integer('age'),
  behaviour: text('behaviour'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const services = pgTable('services', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  priceCents: integer('price_cents').notNull(),
  active: boolean('active').default(true).notNull(),
  description: text('description'),
  dogSizeRule: varchar('dog_size_rule'),
  staffRule: varchar('staff_rule'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('services_business_id_idx').on(table.businessId),
]);

export const jobs = pgTable('jobs', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  serviceId: varchar('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
  staffId: varchar('staff_id').references(() => users.id, { onDelete: 'set null' }),
  recurringJobId: varchar('recurring_job_id').references(() => recurringJobs.id, { onDelete: 'cascade' }),
  dogIds: jsonb('dog_ids').notNull(),
  start: timestamp('start').notNull(),
  end: timestamp('end'),
  status: varchar('status').notNull().default('PENDING'),
  priceCents: integer('price_cents'),
  notes: text('notes'),
  walkRoute: jsonb('walk_route'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('jobs_business_id_idx').on(table.businessId),
  index('jobs_client_id_idx').on(table.clientId),
  index('jobs_staff_id_idx').on(table.staffId),
  index('jobs_start_idx').on(table.start.desc()),
  index('jobs_status_idx').on(table.status),
]);

export const availability = pgTable('availability', {
  id: serial('id').primaryKey(),
  staffId: varchar('staff_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  day: varchar('day').notNull(),
  start: varchar('start').notNull(),
  end: varchar('end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const invoices = pgTable('invoices', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  jobId: varchar('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(),
  status: varchar('status').notNull().default('DRAFT'),
  paidAt: timestamp('paid_at'),
  sentToClient: timestamp('sent_to_client'),
  paymentMethod: varchar('payment_method'),
  paymentUrl: varchar('payment_url'),
  stripePaymentUrl: varchar('stripe_payment_url'),
  dueDate: timestamp('due_date'),
  invoiceNumber: varchar('invoice_number'),
  notes: text('notes'),
  meta: jsonb('meta'),
  lastReminderAt: timestamp('last_reminder_at'),
  reminderCount: integer('reminder_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('invoices_business_id_idx').on(table.businessId),
  index('invoices_client_id_idx').on(table.clientId),
]);

export const invoiceItems = pgTable('invoice_items', {
  id: varchar('id').primaryKey(),
  invoiceId: varchar('invoice_id').references(() => invoices.id, { onDelete: 'cascade' }),
  jobId: varchar('job_id').references(() => jobs.id, { onDelete: 'set null' }),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull().default(1),
  priceCents: integer('price_cents').notNull(),
  date: timestamp('date').notNull(),
  status: varchar('status').notNull().default('PENDING'),
  billedAt: timestamp('billed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const recurringJobs = pgTable('recurring_jobs', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  staffId: varchar('staff_id').references(() => users.id, { onDelete: 'set null' }),
  serviceId: varchar('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
  dogIds: jsonb('dog_ids').notNull(),
  rule: jsonb('rule').notNull(),
  active: boolean('active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const cancellations = pgTable('cancellations', {
  id: serial('id').primaryKey(),
  jobId: varchar('job_id').notNull().references(() => jobs.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  cancelledBy: varchar('cancelled_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').references(() => clients.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'set null' }),
  bookingId: varchar('booking_id').references(() => jobs.id, { onDelete: 'cascade' }),
  threadId: varchar('thread_id'),
  subject: varchar('subject'),
  body: text('body').notNull(),
  senderRole: varchar('sender_role').notNull().default('business'),
  direction: varchar('direction'),
  read: boolean('read').default(false),
  readByClient: boolean('read_by_client').default(false).notNull(),
  readByBusiness: boolean('read_by_business').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const betaTesters = pgTable('beta_testers', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  email: varchar('email').notNull(),
  businessName: varchar('business_name').notNull(),
  phone: varchar('phone'),
  location: varchar('location'),
  businessSize: varchar('business_size'),
  servicesOffered: text('services_offered'),
  currentTools: text('current_tools'),
  website: varchar('website'),
  comments: text('comments'),
  notes: text('notes'),
  status: varchar('status').notNull().default('APPLIED'),
  referredByCode: varchar('referred_by_code'),
  businessId: varchar('business_id').references(() => businesses.id, { onDelete: 'set null' }),
  betaStartedAt: timestamp('beta_started_at'),
  betaEndsAt: timestamp('beta_ends_at'),
  activatedAt: timestamp('activated_at'),
  lastLoginAt: timestamp('last_login_at'),
  founderEmailScheduledAt: timestamp('founder_email_scheduled_at'),
  founderEmailSentAt: timestamp('founder_email_sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const referrals = pgTable('referrals', {
  id: varchar('id').primaryKey(),
  referrerBusinessId: varchar('referrer_business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  referredBusinessId: varchar('referred_business_id').references(() => businesses.id, { onDelete: 'set null' }),
  referredEmail: varchar('referred_email').notNull(),
  status: varchar('status').notNull().default('PENDING'),
  convertedAt: timestamp('converted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemLogs = pgTable('system_logs', {
  id: serial('id').primaryKey(),
  businessId: varchar('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  logType: varchar('log_type').notNull(),
  severity: varchar('severity').notNull().default('INFO'),
  message: text('message').notNull(),
  metadata: jsonb('metadata'),
  userId: varchar('user_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const systemErrorEvents = pgTable('system_error_events', {
  id: serial('id').primaryKey(),
  errorHash: varchar('error_hash').notNull(),
  endpoint: varchar('endpoint').notNull(),
  method: varchar('method').notNull(),
  statusCode: integer('status_code').notNull(),
  businessId: varchar('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar('user_id'),
  userRole: varchar('user_role'),
  errorMessage: text('error_message').notNull(),
  stackTrace: text('stack_trace'),
  requestContext: jsonb('request_context'),
  dedupeCount: integer('dedupe_count').notNull().default(1),
  firstOccurredAt: timestamp('first_occurred_at').defaultNow().notNull(),
  lastOccurredAt: timestamp('last_occurred_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('error_events_hash_idx').on(table.errorHash),
  index('error_events_business_idx').on(table.businessId),
  index('error_events_endpoint_idx').on(table.endpoint),
  index('error_events_created_idx').on(table.createdAt.desc()),
  index('error_events_status_idx').on(table.statusCode),
]);

export const feedbackItems = pgTable('feedback_items', {
  id: serial('id').primaryKey(),
  businessId: varchar('business_id').references(() => businesses.id, { onDelete: 'set null' }),
  userId: varchar('user_id'),
  userRole: varchar('user_role').notNull().default('ANON'),
  source: varchar('source').notNull().default('CHAT_WIDGET'),
  category: varchar('category').notNull().default('OTHER'),
  domain: varchar('domain').notNull().default('OTHER'),
  severity: varchar('severity').notNull().default('MEDIUM'),
  title: varchar('title').notNull().default('Untitled'),
  description: text('description').notNull().default(''),
  context: jsonb('context'),
  status: varchar('status').notNull().default('OPEN'),
  occurrenceCount: integer('occurrence_count').notNull().default(1),
  betaStatusSnapshot: varchar('beta_status_snapshot'),
  inferredCategory: varchar('inferred_category'),
  confidence: integer('confidence'),
  priorityScore: integer('priority_score').default(0),
  impactEstimate: varchar('impact_estimate').default('MEDIUM'),
  tags: jsonb('tags'),
  assignedTo: varchar('assigned_to'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastSeenAt: timestamp('last_seen_at').defaultNow().notNull(),
});

export const businessFeatures = pgTable('business_features', {
  id: serial('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }).unique(),
  premiumDashboards: boolean('premium_dashboards').default(false).notNull(),
  gpsWalkRoutes: boolean('gps_walk_routes').default(true).notNull(),
  automations: boolean('automations').default(false).notNull(),
  referralBoost: boolean('referral_boost').default(false).notNull(),
  multiStaff: boolean('multi_staff').default(true).notNull(),
  routeOptimisation: boolean('route_optimisation').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const communityEvents = pgTable('community_events', {
  id: varchar('id').primaryKey(),
  title: varchar('title').notNull(),
  description: text('description'),
  date: varchar('date').notNull(),
  time: varchar('time').notNull(),
  location: varchar('location').notNull(),
  city: varchar('city').notNull(),
  postcode: varchar('postcode'),
  createdBy: varchar('created_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const eventRsvps = pgTable('event_rsvps', {
  id: serial('id').primaryKey(),
  eventId: varchar('event_id').notNull().references(() => communityEvents.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  uniqueEventUser: unique().on(table.eventId, table.userId),
}));

export const referralCommissions = pgTable('referral_commissions', {
  id: serial('id').primaryKey(),
  referrerBusinessId: varchar('referrer_business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  referredBusinessId: varchar('referred_business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  referredBusinessName: varchar('referred_business_name').notNull(),
  billingPeriod: varchar('billing_period').notNull(),
  planPriceCents: integer('plan_price_cents').notNull(),
  commissionRate: integer('commission_rate').notNull().default(10),
  commissionCents: integer('commission_cents').notNull(),
  status: varchar('status').notNull().default('PENDING'),
  paidAt: timestamp('paid_at'),
  paymentMethod: varchar('payment_method'),
  paymentReference: varchar('payment_reference'),
  notifiedAt: timestamp('notified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('referral_commissions_referrer_idx').on(table.referrerBusinessId),
  index('referral_commissions_status_idx').on(table.status),
  index('referral_commissions_created_idx').on(table.createdAt.desc()),
]);

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  userId: varchar('user_id'),
  userRole: varchar('user_role'),
  userName: varchar('user_name'),
  eventType: varchar('event_type').notNull(),
  entityType: varchar('entity_type').notNull(),
  entityId: varchar('entity_id'),
  description: text('description').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  index('activity_logs_business_idx').on(table.businessId),
  index('activity_logs_created_idx').on(table.createdAt.desc()),
  index('activity_logs_event_type_idx').on(table.eventType),
]);

// --- RELATIONS ---

export const businessesRelations = relations(businesses, ({ many }) => ({
  users: many(users),
  clients: many(clients),
  services: many(services),
  jobs: many(jobs),
  invoices: many(invoices),
  recurringJobs: many(recurringJobs),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  business: one(businesses, {
    fields: [users.businessId],
    references: [businesses.id],
  }),
  jobs: many(jobs),
  availability: many(availability),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  business: one(businesses, {
    fields: [clients.businessId],
    references: [businesses.id],
  }),
  dogs: many(dogs),
  jobs: many(jobs),
  invoices: many(invoices),
}));

export const dogsRelations = relations(dogs, ({ one }) => ({
  client: one(clients, {
    fields: [dogs.clientId],
    references: [clients.id],
  }),
}));

export const servicesRelations = relations(services, ({ one, many }) => ({
  business: one(businesses, {
    fields: [services.businessId],
    references: [businesses.id],
  }),
  jobs: many(jobs),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  business: one(businesses, {
    fields: [jobs.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [jobs.clientId],
    references: [clients.id],
  }),
  service: one(services, {
    fields: [jobs.serviceId],
    references: [services.id],
  }),
  staff: one(users, {
    fields: [jobs.staffId],
    references: [users.id],
  }),
  recurringJob: one(recurringJobs, {
    fields: [jobs.recurringJobId],
    references: [recurringJobs.id],
  }),
  invoices: many(invoices),
  cancellations: many(cancellations),
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  staff: one(users, {
    fields: [availability.staffId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  business: one(businesses, {
    fields: [invoices.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [invoices.clientId],
    references: [clients.id],
  }),
  job: one(jobs, {
    fields: [invoices.jobId],
    references: [jobs.id],
  }),
  items: many(invoiceItems),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
  job: one(jobs, {
    fields: [invoiceItems.jobId],
    references: [jobs.id],
  }),
  business: one(businesses, {
    fields: [invoiceItems.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [invoiceItems.clientId],
    references: [clients.id],
  }),
}));

export const recurringJobsRelations = relations(recurringJobs, ({ one, many }) => ({
  business: one(businesses, {
    fields: [recurringJobs.businessId],
    references: [businesses.id],
  }),
  client: one(clients, {
    fields: [recurringJobs.clientId],
    references: [clients.id],
  }),
  staff: one(users, {
    fields: [recurringJobs.staffId],
    references: [users.id],
  }),
  service: one(services, {
    fields: [recurringJobs.serviceId],
    references: [services.id],
  }),
  jobs: many(jobs),
}));

export const communityEventsRelations = relations(communityEvents, ({ many }) => ({
  rsvps: many(eventRsvps),
}));

export const eventRsvpsRelations = relations(eventRsvps, ({ one }) => ({
  event: one(communityEvents, {
    fields: [eventRsvps.eventId],
    references: [communityEvents.id],
  }),
}));

export const media = pgTable('media', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  uploadedBy: varchar('uploaded_by').notNull().references(() => users.id, { onDelete: 'cascade' }),
  uploaderRole: varchar('uploader_role').notNull(),
  mediaType: varchar('media_type').notNull(),
  fileType: varchar('file_type').notNull(),
  fileName: varchar('file_name').notNull(),
  fileUrl: text('file_url').notNull(),
  fileSizeBytes: integer('file_size_bytes').notNull(),
  jobId: varchar('job_id').references(() => jobs.id, { onDelete: 'cascade' }),
  dogId: varchar('dog_id').references(() => dogs.id, { onDelete: 'cascade' }),
  userId: varchar('user_id').references(() => users.id, { onDelete: 'cascade' }),
  caption: text('caption'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('media_business_id_idx').on(table.businessId),
  index('media_job_id_idx').on(table.jobId),
  index('media_dog_id_idx').on(table.dogId),
  index('media_user_id_idx').on(table.userId),
]);

export const mediaRelations = relations(media, ({ one }) => ({
  business: one(businesses, {
    fields: [media.businessId],
    references: [businesses.id],
  }),
  uploader: one(users, {
    fields: [media.uploadedBy],
    references: [users.id],
  }),
  job: one(jobs, {
    fields: [media.jobId],
    references: [jobs.id],
  }),
  dog: one(dogs, {
    fields: [media.dogId],
    references: [dogs.id],
  }),
  user: one(users, {
    fields: [media.userId],
    references: [users.id],
  }),
}));

export const jobLocks = pgTable('job_locks', {
  id: serial('id').primaryKey(),
  jobName: varchar('job_name').notNull(),
  businessId: varchar('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
  lastRunAt: timestamp('last_run_at').notNull(),
  lockAcquiredAt: timestamp('lock_acquired_at'),
  lockExpiresAt: timestamp('lock_expires_at'),
  status: varchar('status').default('completed').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('job_locks_job_name_idx').on(table.jobName),
  index('job_locks_business_id_idx').on(table.businessId),
  unique('job_locks_job_business_unique').on(table.jobName, table.businessId),
]);

export const jobLocksRelations = relations(jobLocks, ({ one }) => ({
  business: one(businesses, {
    fields: [jobLocks.businessId],
    references: [businesses.id],
  }),
}));

