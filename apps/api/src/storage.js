// apps/api/src/storage.ts
// Database storage layer using Drizzle ORM
// Implements the same interface as the in-memory store but with Postgres persistence

import { db } from './db.js';
import { 
  businesses, users, clients, dogs, services, jobs, 
  availability, invoices, invoiceItems, recurringJobs, 
  cancellations, messages 
} from '../../../shared/schema.js';
import { eq, and, or, gte, lte, inArray, sql } from 'drizzle-orm';

/**
 * Helper function to execute database operations in a transaction
 */
export async function withTransaction(callback) {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

/**
 * Storage layer - all functions return plain JS objects matching the in-memory store format
 */
export const storage = {
  // ========== BUSINESSES ==========
  async getBusiness(id) {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || null;
  },

  async getAllBusinesses() {
    return await db.select().from(businesses);
  },

  async createBusiness(data) {
    // Ensure settings has a default
    const businessData = {
      ...data,
      settings: data.settings || {}
    };
    const [business] = await db.insert(businesses).values(businessData).returning();
    return business;
  },

  async updateBusiness(id, updates) {
    const [business] = await db
      .update(businesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  },

  // ========== USERS ==========
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  },

  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  },

  async getUsersByBusiness(businessId) {
    return await db.select().from(users).where(eq(users.businessId, businessId));
  },

  async getAllUsers() {
    return await db.select().from(users);
  },

  async createUser(data) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async updateUser(id, updates) {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async deleteUser(id) {
    await db.delete(users).where(eq(users.id, id));
  },

  // ========== CLIENTS ==========
  async getClient(id) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || null;
  },

  async getClientsByBusiness(businessId) {
    return await db.select().from(clients).where(eq(clients.businessId, businessId));
  },

  async createClient(data) {
    // Ensure dogIds has a default
    const clientData = {
      ...data,
      dogIds: data.dogIds || []
    };
    const [client] = await db.insert(clients).values(clientData).returning();
    return client;
  },

  async getClientByEmailAndBusiness(email, businessId) {
    const [client] = await db.select().from(clients)
      .where(and(eq(clients.email, email), eq(clients.businessId, businessId)));
    return client || null;
  },

  async updateClient(id, updates) {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  },

  async deleteClient(id) {
    await db.delete(clients).where(eq(clients.id, id));
  },

  // ========== DOGS ==========
  async getDog(id) {
    const [dog] = await db.select().from(dogs).where(eq(dogs.id, id));
    return dog || null;
  },

  async getDogsByClient(clientId) {
    return await db.select().from(dogs).where(eq(dogs.clientId, clientId));
  },

  async getDogsByClientIds(clientIds) {
    if (!clientIds || clientIds.length === 0) return [];
    return await db.select().from(dogs).where(inArray(dogs.clientId, clientIds));
  },

  async createDog(data) {
    const [dog] = await db.insert(dogs).values(data).returning();
    return dog;
  },

  async updateDog(id, updates) {
    const [dog] = await db
      .update(dogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dogs.id, id))
      .returning();
    return dog;
  },

  async deleteDog(id) {
    await db.delete(dogs).where(eq(dogs.id, id));
  },

  // ========== SERVICES ==========
  async getService(id) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || null;
  },

  async getServicesByBusiness(businessId) {
    return await db.select().from(services).where(eq(services.businessId, businessId));
  },

  async createService(data) {
    const [service] = await db.insert(services).values(data).returning();
    return service;
  },

  async updateService(id, updates) {
    const [service] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  },

  async deleteService(id) {
    await db.delete(services).where(eq(services.id, id));
  },

  // ========== JOBS/BOOKINGS ==========
  async getJob(id) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || null;
  },

  async getJobsByBusiness(businessId) {
    return await db.select().from(jobs).where(eq(jobs.businessId, businessId));
  },

  async getJobsByClient(clientId) {
    return await db.select().from(jobs).where(eq(jobs.clientId, clientId));
  },

  async getJobsByStaff(staffId) {
    return await db.select().from(jobs).where(eq(jobs.staffId, staffId));
  },

  async getJobsByDateRange(businessId, start, end) {
    return await db
      .select()
      .from(jobs)
      .where(
        and(
          eq(jobs.businessId, businessId),
          gte(jobs.start, start),
          lte(jobs.start, end)
        )
      );
  },

  async createJob(data) {
    const jobData = {
      ...data,
      start: typeof data.start === 'string' ? new Date(data.start) : data.start,
      end: data.end ? (typeof data.end === 'string' ? new Date(data.end) : data.end) : null,
      completedAt: data.completedAt ? new Date(data.completedAt) : null,
      cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null,
    };
    const [job] = await db.insert(jobs).values(jobData).returning();
    return job;
  },

  async updateJob(id, updates) {
    const updateData = { ...updates, updatedAt: new Date() };
    
    if (updates.start && typeof updates.start === 'string') {
      updateData.start = new Date(updates.start);
    }
    if (updates.end && typeof updates.end === 'string') {
      updateData.end = new Date(updates.end);
    }
    if (updates.completedAt && typeof updates.completedAt === 'string') {
      updateData.completedAt = new Date(updates.completedAt);
    }
    if (updates.cancelledAt && typeof updates.cancelledAt === 'string') {
      updateData.cancelledAt = new Date(updates.cancelledAt);
    }
    
    const [job] = await db
      .update(jobs)
      .set(updateData)
      .where(eq(jobs.id, id))
      .returning();
    return job;
  },

  async deleteJob(id) {
    await db.delete(jobs).where(eq(jobs.id, id));
  },

  // ========== AVAILABILITY ==========
  async getAvailabilityByStaff(staffId) {
    return await db.select().from(availability).where(eq(availability.staffId, staffId));
  },

  async setAvailability(staffId, schedules) {
    await db.delete(availability).where(eq(availability.staffId, staffId));
    if (schedules.length > 0) {
      await db.insert(availability).values(
        schedules.map(s => ({ staffId, ...s }))
      );
    }
    return await db.select().from(availability).where(eq(availability.staffId, staffId));
  },

  // ========== INVOICES ==========
  async getInvoice(id) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || null;
  },

  async getInvoicesByBusiness(businessId) {
    return await db.select().from(invoices).where(eq(invoices.businessId, businessId));
  },

  async getInvoicesByClient(clientId) {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  },

  async createInvoice(data) {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  },

  async updateInvoice(id, updates) {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  },

  // ========== INVOICE ITEMS ==========
  async getInvoiceItemsByInvoice(invoiceId) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  },

  async getInvoiceItemsByBusiness(businessId) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.businessId, businessId));
  },

  async createInvoiceItem(data) {
    const [item] = await db.insert(invoiceItems).values(data).returning();
    return item;
  },

  async updateInvoiceItem(id, updates) {
    const [item] = await db
      .update(invoiceItems)
      .set(updates)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  },

  // ========== RECURRING JOBS ==========
  async getRecurringJobsByBusiness(businessId) {
    return await db.select().from(recurringJobs).where(eq(recurringJobs.businessId, businessId));
  },

  async createRecurringJob(data) {
    const [job] = await db.insert(recurringJobs).values(data).returning();
    return job;
  },

  async updateRecurringJob(id, updates) {
    const [job] = await db
      .update(recurringJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recurringJobs.id, id))
      .returning();
    return job;
  },

  // ========== MESSAGES ==========
  async getMessagesByBusiness(businessId) {
    return await db.select().from(messages).where(eq(messages.businessId, businessId));
  },

  async getMessagesByThread(threadId) {
    return await db.select().from(messages).where(eq(messages.threadId, threadId));
  },

  async createMessage(data) {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  },

  async markMessageRead(id) {
    const [message] = await db
      .update(messages)
      .set({ read: true })
      .where(eq(messages.id, id))
      .returning();
    return message;
  },

  // ========== UTILS ==========
  async clearAllData() {
    // For testing only - clear all data
    await db.delete(messages);
    await db.delete(cancellations);
    await db.delete(recurringJobs);
    await db.delete(invoiceItems);
    await db.delete(invoices);
    await db.delete(jobs);
    await db.delete(availability);
    await db.delete(services);
    await db.delete(dogs);
    await db.delete(clients);
    await db.delete(users);
    await db.delete(businesses);
  }
};
