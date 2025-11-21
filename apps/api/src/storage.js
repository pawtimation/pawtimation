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
    const invoiceData = {
      ...data,
      paidAt: data.paidAt ? (typeof data.paidAt === 'string' ? new Date(data.paidAt) : data.paidAt) : null,
      sentToClient: data.sentToClient ? (typeof data.sentToClient === 'string' ? new Date(data.sentToClient) : data.sentToClient) : null,
      dueDate: data.dueDate ? (typeof data.dueDate === 'string' ? new Date(data.dueDate) : data.dueDate) : null,
    };
    const [invoice] = await db.insert(invoices).values(invoiceData).returning();
    return invoice;
  },

  async updateInvoice(id, updates) {
    const updateData = { ...updates, updatedAt: new Date() };
    
    if (updates.paidAt && typeof updates.paidAt === 'string') {
      updateData.paidAt = new Date(updates.paidAt);
    }
    if (updates.sentToClient && typeof updates.sentToClient === 'string') {
      updateData.sentToClient = new Date(updates.sentToClient);
    }
    if (updates.dueDate && typeof updates.dueDate === 'string') {
      updateData.dueDate = new Date(updates.dueDate);
    }
    
    const [invoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();
    return invoice;
  },

  // ========== INVOICE ITEMS ==========
  async getInvoiceItem(id) {
    const [item] = await db.select().from(invoiceItems).where(eq(invoiceItems.id, id));
    return item || null;
  },

  async getInvoiceItemsByInvoice(invoiceId) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));
  },

  async getInvoiceItemsByBusiness(businessId) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.businessId, businessId));
  },

  async getInvoiceItemsByClient(clientId) {
    return await db.select().from(invoiceItems).where(eq(invoiceItems.clientId, clientId));
  },

  async createInvoiceItem(data) {
    const itemData = {
      ...data,
      date: data.date ? (typeof data.date === 'string' ? new Date(data.date) : data.date) : new Date(),
      billedAt: data.billedAt ? (typeof data.billedAt === 'string' ? new Date(data.billedAt) : data.billedAt) : null,
    };
    const [item] = await db.insert(invoiceItems).values(itemData).returning();
    return item;
  },

  async updateInvoiceItem(id, updates) {
    const updateData = { ...updates };
    
    if (updates.date && typeof updates.date === 'string') {
      updateData.date = new Date(updates.date);
    }
    if (updates.billedAt && typeof updates.billedAt === 'string') {
      updateData.billedAt = new Date(updates.billedAt);
    }
    
    const [item] = await db
      .update(invoiceItems)
      .set(updateData)
      .where(eq(invoiceItems.id, id))
      .returning();
    return item;
  },

  // ========== RECURRING JOBS ==========
  async getRecurringJob(id) {
    const [job] = await db.select().from(recurringJobs).where(eq(recurringJobs.id, id));
    return job || null;
  },

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

  async createRecurringRuleWithJobs(ruleData, jobsData) {
    return await withTransaction(async (tx) => {
      const [recurringJob] = await tx.insert(recurringJobs).values(ruleData).returning();
      
      const createdJobs = [];
      const errors = [];
      
      for (const jobData of jobsData) {
        try {
          const jobWithDefaults = {
            ...jobData,
            recurringJobId: recurringJob.id,
            start: typeof jobData.start === 'string' ? new Date(jobData.start) : jobData.start,
            end: jobData.end ? (typeof jobData.end === 'string' ? new Date(jobData.end) : jobData.end) : null,
            completedAt: jobData.completedAt ? (typeof jobData.completedAt === 'string' ? new Date(jobData.completedAt) : jobData.completedAt) : null,
            cancelledAt: jobData.cancelledAt ? (typeof jobData.cancelledAt === 'string' ? new Date(jobData.cancelledAt) : jobData.cancelledAt) : null,
          };
          const [job] = await tx.insert(jobs).values(jobWithDefaults).returning();
          createdJobs.push(job);
        } catch (err) {
          errors.push({ date: jobData.start, error: err.message });
          throw err;
        }
      }
      
      return {
        recurringJob,
        jobs: createdJobs,
        errors: errors.length > 0 ? errors : undefined,
      };
    });
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
