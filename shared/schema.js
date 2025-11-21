// shared/schema.ts
// Drizzle ORM schema for Pawtimation CRM - Matches in-memory store.js structure exactly

import { pgTable, varchar, text, integer, boolean, timestamp, jsonb, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const businesses = pgTable('businesses', {
  id: varchar('id').primaryKey(),
  name: varchar('name').notNull(),
  ownerUserId: varchar('owner_user_id'),
  settings: jsonb('settings').notNull(),
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
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  name: varchar('name').notNull(),
  email: varchar('email'),
  phone: varchar('phone'),
  address: jsonb('address'),
  notes: text('notes'),
  dogIds: jsonb('dog_ids'),
  passwordHash: varchar('password_hash'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
});

export const jobs = pgTable('jobs', {
  id: varchar('id').primaryKey(),
  businessId: varchar('business_id').notNull().references(() => businesses.id, { onDelete: 'cascade' }),
  clientId: varchar('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  serviceId: varchar('service_id').notNull().references(() => services.id, { onDelete: 'restrict' }),
  staffId: varchar('staff_id').references(() => users.id, { onDelete: 'set null' }),
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
});

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
  dueDate: timestamp('due_date'),
  invoiceNumber: varchar('invoice_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

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
  threadId: varchar('thread_id'),
  subject: varchar('subject'),
  body: text('body').notNull(),
  direction: varchar('direction').notNull(),
  read: boolean('read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

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

export const recurringJobsRelations = relations(recurringJobs, ({ one }) => ({
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
}));

