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
export async function withTransaction<T>(callback: (tx: typeof db) => Promise<T>): Promise<T> {
  return await db.transaction(async (tx) => {
    return await callback(tx);
  });
}

/**
 * Storage layer - all functions return plain JS objects matching the in-memory store format
 */
export const storage = {
  // ========== BUSINESSES ==========
  async getBusiness(id: string) {
    const [business] = await db.select().from(businesses).where(eq(businesses.id, id));
    return business || null;
  },

  async getAllBusinesses() {
    return await db.select().from(businesses);
  },

  async createBusiness(data: any) {
    const [business] = await db.insert(businesses).values(data).returning();
    return business;
  },

  async updateBusiness(id: string, updates: any) {
    const [business] = await db
      .update(businesses)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businesses.id, id))
      .returning();
    return business;
  },

  // ========== USERS ==========
  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  },

  async getUsersByBusiness(businessId: string) {
    return await db.select().from(users).where(eq(users.businessId, businessId));
  },

  async createUser(data: any) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  },

  async updateUser(id: string, updates: any) {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  },

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  },

  // ========== CLIENTS ==========
  async getClient(id: string) {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || null;
  },

  async getClientsByBusiness(businessId: string) {
    return await db.select().from(clients).where(eq(clients.businessId, businessId));
  },

  async createClient(data: any) {
    const [client] = await db.insert(clients).values(data).returning();
    return client;
  },

  async updateClient(id: string, updates: any) {
    const [client] = await db
      .update(clients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clients.id, id))
      .returning();
    return client;
  },

  async deleteClient(id: string) {
    await db.delete(clients).where(eq(clients.id, id));
  },

  // ========== DOGS ==========
  async getDog(id: string) {
    const [dog] = await db.select().from(dogs).where(eq(dogs.id, id));
    return dog || null;
  },

  async getDogsByClient(clientId: string) {
    return await db.select().from(dogs).where(eq(dogs.clientId, clientId));
  },

  async createDog(data: any) {
    const [dog] = await db.insert(dogs).values(data).returning();
    return dog;
  },

  async updateDog(id: string, updates: any) {
    const [dog] = await db
      .update(dogs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(dogs.id, id))
      .returning();
    return dog;
  },

  async deleteDog(id: string) {
    await db.delete(dogs).where(eq(dogs.id, id));
  },

  // ========== SERVICES ==========
  async getService(id: string) {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service || null;
  },

  async getServicesByBusiness(businessId: string) {
    return await db.select().from(services).where(eq(services.businessId, businessId));
  },

  async createService(data: any) {
    const [service] = await db.insert(services).values(data).returning();
    return service;
  },

  async updateService(id: string, updates: any) {
    const [service] = await db
      .update(services)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(services.id, id))
      .returning();
    return service;
  },

  async deleteService(id: string) {
    await db.delete(services).where(eq(services.id, id));
  },

  // ========== JOBS/BOOKINGS ==========
  async getJob(id: string) {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || null;
  },

  async getJobsByBusiness(businessId: string) {
    return await db.select().from(jobs).where(eq(jobs.businessId, businessId));
  },

  async getJobsByClient(clientId: string) {
    return await db.select().from(jobs).where(eq(jobs.clientId, clientId));
  },

  async getJobsByStaff(staffId: string) {
    return await db.select().from(jobs).where(eq(jobs.staffId, staffId));
  },

  async getJobsByDateRange(businessId: string, start: Date, end: Date) {
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

  async createJob(data: any) {
    const [job] = await db.insert(jobs).values(data).returning();
    return job;
  },

  async updateJob(id: string, updates: any) {
    const [job] = await db
      .update(jobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(jobs.id, id))
      .returning();
    return job;
  },

  async deleteJob(id: string) {
    await db.delete(jobs).where(eq(jobs.id, id));
  },

  // ========== AVAILABILITY ==========
  async getAvailabilityByStaff(staffId: string) {
    return await db.select().from(availability).where(eq(availability.staffId, staffId));
  },

  async setAvailability(staffId: string, schedules: any[]) {
    await db.delete(availability).where(eq(availability.staffId, staffId));
    if (schedules.length > 0) {
      await db.insert(availability).values(
        schedules.map(s => ({ staffId, ...s }))
      );
    }
    return await db.select().from(availability).where(eq(availability.staffId, staffId));
  },

  // ========== INVOICES ==========
  async getInvoice(id: string) {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice || null;
  },

  async getInvoicesByBusiness(businessId: string) {
    return await db.select().from(invoices).where(eq(invoices.businessId, businessId));
  },

  async getInvoicesByClient(clientId: string) {
    return await db.select().from(invoices).where(eq(invoices.clientId, clientId));
  },

  async createInvoice(data: any) {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  },

  async updateInvoice(id: string, updates: any) {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  },

  // ========== INVOICE ITEMS ==========
  async getInvoiceItemsByInvoice(invoiceId: string) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  },

  async getInvoiceItemsByBusiness(businessId: string) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.businessId, businessId));
  },

  async createInvoiceItem(data: any) {
    const [item] = await db.insert(invoiceItems).values(data).returning();
    return item;
  },

  async updateInvoiceItem(id: string, updates: any) {
    const [item] = await db
      .update(invoiceItems)
      .set(updates)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  },

  // ========== RECURRING JOBS ==========
  async getRecurringJobsByBusiness(businessId: string) {
    return await db.select().from(recurringJobs).where(eq(recurringJobs.businessId, businessId));
  },

  async createRecurringJob(data: any) {
    const [job] = await db.insert(recurringJobs).values(data).returning();
    return job;
  },

  async updateRecurringJob(id: string, updates: any) {
    const [job] = await db
      .update(recurringJobs)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(recurringJobs.id, id))
      .returning();
    return job;
  },

  // ========== MESSAGES ==========
  async getMessagesByBusiness(businessId: string) {
    return await db.select().from(messages).where(eq(messages.businessId, businessId));
  },

  async getMessagesByThread(threadId: string) {
    return await db.select().from(messages).where(eq(messages.threadId, threadId));
  },

  async createMessage(data: any) {
    const [message] = await db.insert(messages).values(data).returning();
    return message;
  },

  async markMessageRead(id: string) {
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
