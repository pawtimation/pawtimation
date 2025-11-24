// apps/api/src/storage.ts
// Database storage layer using Drizzle ORM
// Implements the same interface as the in-memory store but with Postgres persistence

import { db } from './db.js';
import { 
  businesses, users, clients, clientInvites, dogs, services, jobs, 
  availability, invoices, invoiceItems, recurringJobs, 
  cancellations, messages, betaTesters, referrals, systemLogs,
  feedbackItems, businessFeatures, communityEvents, eventRsvps, media, jobLocks
} from '../../../shared/schema.js';
import { eq, and, or, gte, lte, inArray, sql, desc, count, isNull } from 'drizzle-orm';

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

  async getBusinessByReferralCode(code) {
    const [business] = await db.select().from(businesses).where(eq(businesses.referralCode, code));
    return business || null;
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

  // ========== CLIENT INVITES ==========
  async createClientInvite(data) {
    const [invite] = await db.insert(clientInvites).values(data).returning();
    return invite;
  },

  async getClientInvite(id) {
    const [invite] = await db.select().from(clientInvites).where(eq(clientInvites.id, id));
    return invite || null;
  },

  async getClientInviteByToken(token) {
    const [invite] = await db.select().from(clientInvites).where(eq(clientInvites.token, token));
    return invite || null;
  },

  async markClientInviteAsUsed(token, clientId) {
    const [invite] = await db
      .update(clientInvites)
      .set({ usedAt: new Date(), usedByClientId: clientId })
      .where(eq(clientInvites.token, token))
      .returning();
    return invite;
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

  // ========== BETA TESTERS ==========
  async getBetaTester(id) {
    const [tester] = await db.select().from(betaTesters).where(eq(betaTesters.id, id));
    return tester || null;
  },

  async getBetaTesterByEmail(email) {
    const [tester] = await db.select().from(betaTesters).where(eq(betaTesters.email, email));
    return tester || null;
  },

  async getBetaTestersByStatus(status) {
    return await db.select().from(betaTesters).where(eq(betaTesters.status, status));
  },

  async getAllBetaTesters() {
    return await db.select().from(betaTesters);
  },

  async countActiveBetaTesters() {
    const result = await db
      .select({ count: sql`count(*)::int` })
      .from(betaTesters)
      .where(eq(betaTesters.status, 'ACTIVE'));
    return result[0]?.count || 0;
  },

  async createBetaTester(data) {
    const [tester] = await db.insert(betaTesters).values(data).returning();
    return tester;
  },

  async updateBetaTester(id, updates) {
    const [tester] = await db
      .update(betaTesters)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(betaTesters.id, id))
      .returning();
    return tester;
  },

  async getBetaTestersNeedingFounderEmail() {
    return await db
      .select()
      .from(betaTesters)
      .where(
        and(
          eq(betaTesters.status, 'ACTIVE'),
          sql`${betaTesters.founderEmailSentAt} IS NULL`,
          lte(betaTesters.founderEmailScheduledAt, new Date())
        )
      );
  },

  // ========== REFERRALS ==========
  async getReferral(id) {
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, id));
    return referral || null;
  },

  async getReferralsByReferrer(referrerBusinessId) {
    return await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerBusinessId, referrerBusinessId));
  },

  async getReferralByEmail(referredEmail) {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredEmail, referredEmail));
    return referral || null;
  },

  async createReferral(data) {
    const [referral] = await db.insert(referrals).values(data).returning();
    return referral;
  },

  async updateReferral(id, updates) {
    const [referral] = await db
      .update(referrals)
      .set(updates)
      .where(eq(referrals.id, id))
      .returning();
    return referral;
  },

  async countConvertedReferrals(referrerBusinessId) {
    const result = await db
      .select({ count: sql`count(*)::int` })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerBusinessId, referrerBusinessId),
          eq(referrals.status, 'PAID')
        )
      );
    return result[0]?.count || 0;
  },

  // ========== SYSTEM LOGS ==========
  async logSystem(data) {
    const logData = {
      businessId: data.businessId || null,
      logType: data.logType,
      severity: data.severity || 'INFO',
      message: data.message,
      metadata: data.metadata || null,
      userId: data.userId || null
    };
    const [log] = await db.insert(systemLogs).values(logData).returning();
    return log;
  },

  async getSystemLogs(filters = {}) {
    const conditions = [];
    
    if (filters.businessId) {
      conditions.push(eq(systemLogs.businessId, filters.businessId));
    }
    
    if (filters.logType) {
      conditions.push(eq(systemLogs.logType, filters.logType));
    }
    
    if (filters.severity) {
      conditions.push(eq(systemLogs.severity, filters.severity));
    }
    
    if (filters.userId) {
      conditions.push(eq(systemLogs.userId, filters.userId));
    }
    
    if (filters.startDate) {
      conditions.push(gte(systemLogs.createdAt, new Date(filters.startDate)));
    }
    
    if (filters.endDate) {
      conditions.push(lte(systemLogs.createdAt, new Date(filters.endDate)));
    }
    
    if (filters.search) {
      conditions.push(
        or(
          sql`${systemLogs.message} ILIKE ${`%${filters.search}%`}`,
          sql`${systemLogs.metadata}::text ILIKE ${`%${filters.search}%`}`
        )
      );
    }
    
    // Build base query with conditions
    let query = db.select().from(systemLogs);
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    // Get total count for pagination
    let countQuery = db.select({ count: count() }).from(systemLogs);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }
    const [{ count: total }] = await countQuery;
    
    // Apply ordering and pagination
    query = query.orderBy(desc(systemLogs.createdAt));
    
    const limit = filters.limit || 100;
    const offset = filters.offset || 0;
    
    query = query.limit(limit).offset(offset);
    
    const logs = await query;
    
    return {
      logs,
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + limit < total
      }
    };
  },

  // ========== FEEDBACK ==========
  async createFeedback(data) {
    const [feedback] = await db.insert(feedbackItems).values(data).returning();
    return feedback;
  },

  async getAllFeedback(filters = {}) {
    let query = db.select().from(feedbackItems);
    
    const conditions = [];
    
    if (filters.domain) {
      conditions.push(eq(feedbackItems.domain, filters.domain));
    }
    
    if (filters.category) {
      conditions.push(eq(feedbackItems.category, filters.category));
    }
    
    if (filters.severity) {
      conditions.push(eq(feedbackItems.severity, filters.severity));
    }
    
    if (filters.status) {
      conditions.push(eq(feedbackItems.status, filters.status));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(feedbackItems.createdAt));
  },

  async getFeedbackByDateRange(startDate, endDate) {
    return await db
      .select()
      .from(feedbackItems)
      .where(
        and(
          gte(feedbackItems.createdAt, startDate),
          lte(feedbackItems.createdAt, endDate)
        )
      )
      .orderBy(desc(feedbackItems.createdAt));
  },

  async updateFeedbackStatus(id, status) {
    const updates = {
      status,
      updatedAt: new Date(),
      lastSeenAt: new Date()
    };
    
    const [feedback] = await db
      .update(feedbackItems)
      .set(updates)
      .where(eq(feedbackItems.id, id))
      .returning();
    
    return feedback;
  },

  async getFeedback(id) {
    const [feedback] = await db
      .select()
      .from(feedbackItems)
      .where(eq(feedbackItems.id, id));
    return feedback || null;
  },

  // ========== BUSINESS FEATURES ==========
  async getBusinessFeatures(businessId) {
    const [features] = await db
      .select()
      .from(businessFeatures)
      .where(eq(businessFeatures.businessId, businessId));
    return features || null;
  },

  async createBusinessFeatures(businessId, features = {}) {
    const featureData = {
      businessId,
      premiumDashboards: features.premiumDashboards || false,
      gpsWalkRoutes: features.gpsWalkRoutes !== undefined ? features.gpsWalkRoutes : true,
      automations: features.automations || false,
      referralBoost: features.referralBoost || false,
      multiStaff: features.multiStaff !== undefined ? features.multiStaff : true,
      routeOptimisation: features.routeOptimisation || false,
    };
    
    const [created] = await db.insert(businessFeatures).values(featureData).returning();
    return created;
  },

  async updateBusinessFeatures(businessId, updates) {
    const [features] = await db
      .update(businessFeatures)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(businessFeatures.businessId, businessId))
      .returning();
    return features;
  },

  async checkFeatureAccess(businessId, featureKey) {
    const features = await this.getBusinessFeatures(businessId);
    
    if (!features) {
      console.warn(`[Feature Access] No features found for business ${businessId} - creating default`);
      const created = await this.createBusinessFeatures(businessId);
      return { allowed: created[featureKey] || false, reason: 'default_created' };
    }
    
    const isAllowed = features[featureKey] || false;
    
    if (!isAllowed) {
      console.log(`[Feature Access] Feature ${featureKey} NOT_ALLOWED for business ${businessId} (tier restriction)`);
      return { allowed: false, reason: 'tier_restriction' };
    }
    
    console.log(`[Feature Access] Feature ${featureKey} ALLOWED for business ${businessId}`);
    return { allowed: true };
  },

  // ========== COMMUNITY EVENTS ==========
  async getAllEvents() {
    return await db.select().from(communityEvents).orderBy(communityEvents.date);
  },

  async getEventsByCity(city) {
    return await db
      .select()
      .from(communityEvents)
      .where(sql`LOWER(${communityEvents.city}) LIKE ${`%${city.toLowerCase()}%`}`)
      .orderBy(communityEvents.date);
  },

  async getEvent(id) {
    const [event] = await db.select().from(communityEvents).where(eq(communityEvents.id, id));
    return event || null;
  },

  async createEvent(data) {
    const [event] = await db.insert(communityEvents).values(data).returning();
    return event;
  },

  async updateEvent(id, updates) {
    const [event] = await db
      .update(communityEvents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(communityEvents.id, id))
      .returning();
    return event;
  },

  async deleteEvent(id) {
    await db.delete(communityEvents).where(eq(communityEvents.id, id));
  },

  async getEventRsvps(eventId) {
    return await db.select().from(eventRsvps).where(eq(eventRsvps.eventId, eventId));
  },

  async getEventRsvpCount(eventId) {
    const [result] = await db
      .select({ count: count() })
      .from(eventRsvps)
      .where(eq(eventRsvps.eventId, eventId));
    return result?.count || 0;
  },

  async hasUserRsvped(eventId, userId) {
    const [rsvp] = await db
      .select()
      .from(eventRsvps)
      .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
    return !!rsvp;
  },

  async createEventRsvp(eventId, userId) {
    try {
      const [rsvp] = await db.insert(eventRsvps).values({ eventId, userId }).returning();
      return rsvp;
    } catch (error) {
      // Handle unique constraint violation (duplicate RSVP)
      if (error.code === '23505') {
        const [existing] = await db
          .select()
          .from(eventRsvps)
          .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
        return existing;
      }
      throw error;
    }
  },

  async deleteEventRsvp(eventId, userId) {
    await db.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
  },

  async toggleEventRsvp(eventId, userId) {
    return await withTransaction(async (tx) => {
      // Check current RSVP status within transaction
      const [existingRsvp] = await tx
        .select()
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
      
      if (existingRsvp) {
        // User has RSVPed - remove it
        await tx.delete(eventRsvps).where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
      } else {
        // User hasn't RSVPed - add it using ON CONFLICT DO NOTHING to prevent transaction abort
        await tx
          .insert(eventRsvps)
          .values({ eventId, userId })
          .onConflictDoNothing();
      }
      
      // Get final RSVP status and count (always succeeds since transaction not aborted)
      const [finalRsvp] = await tx
        .select()
        .from(eventRsvps)
        .where(and(eq(eventRsvps.eventId, eventId), eq(eventRsvps.userId, userId)));
      
      const [countResult] = await tx
        .select({ count: count() })
        .from(eventRsvps)
        .where(eq(eventRsvps.eventId, eventId));
      
      return {
        rsvped: !!finalRsvp,
        attendees: countResult?.count || 0
      };
    });
  },

  // ========== MEDIA ==========
  async getMedia(id) {
    const [mediaItem] = await db.select().from(media).where(eq(media.id, id));
    return mediaItem || null;
  },

  async getMediaByBusiness(businessId) {
    return await db.select().from(media)
      .where(eq(media.businessId, businessId))
      .orderBy(desc(media.createdAt));
  },

  async getMediaByJob(jobId) {
    return await db.select().from(media)
      .where(eq(media.jobId, jobId))
      .orderBy(media.createdAt);
  },

  async getMediaByDog(dogId) {
    return await db.select().from(media)
      .where(eq(media.dogId, dogId))
      .orderBy(desc(media.createdAt));
  },

  async getMediaByUser(userId, mediaType = null) {
    if (mediaType) {
      return await db.select().from(media)
        .where(and(eq(media.userId, userId), eq(media.mediaType, mediaType)))
        .orderBy(desc(media.createdAt));
    }
    return await db.select().from(media)
      .where(eq(media.userId, userId))
      .orderBy(desc(media.createdAt));
  },

  async createMedia(data) {
    const [mediaItem] = await db.insert(media).values(data).returning();
    return mediaItem;
  },

  async updateMedia(id, updates) {
    const [mediaItem] = await db
      .update(media)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(media.id, id))
      .returning();
    return mediaItem;
  },

  async deleteMedia(id) {
    await db.delete(media).where(eq(media.id, id));
  },

  async deleteMediaByJob(jobId) {
    await db.delete(media).where(eq(media.jobId, jobId));
  },

  // ========== JOB LOCKS ==========
  async acquireJobLock(jobName, businessId = null, cooldownHours = 23) {
    const now = new Date();
    const cooldownCutoff = new Date(now.getTime() - cooldownHours * 60 * 60 * 1000);
    
    try {
      // Check if lock exists and is within cooldown period
      const whereCondition = businessId
        ? and(eq(jobLocks.jobName, jobName), eq(jobLocks.businessId, businessId))
        : and(eq(jobLocks.jobName, jobName), isNull(jobLocks.businessId));
      
      const existingLock = await db
        .select()
        .from(jobLocks)
        .where(whereCondition)
        .limit(1);
      
      if (existingLock.length > 0) {
        const lock = existingLock[0];
        const lastRun = new Date(lock.lastRunAt);
        
        // Check if within cooldown period
        if (lastRun > cooldownCutoff) {
          return { 
            acquired: false, 
            reason: 'cooldown', 
            lastRunAt: lock.lastRunAt,
            nextRunAt: new Date(lastRun.getTime() + cooldownHours * 60 * 60 * 1000)
          };
        }
      }
      
      // Acquire lock
      const lockExpiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 minute lock expiry
      
      const lockData = {
        jobName,
        businessId: businessId || null,
        lastRunAt: now,
        lockAcquiredAt: now,
        lockExpiresAt,
        status: 'running'
      };
      
      if (existingLock.length > 0) {
        // Update existing lock
        const [updatedLock] = await db
          .update(jobLocks)
          .set({ ...lockData, updatedAt: now })
          .where(whereCondition)
          .returning();
        return { acquired: true, lock: updatedLock };
      } else {
        // Insert new lock
        const [newLock] = await db.insert(jobLocks).values(lockData).returning();
        return { acquired: true, lock: newLock };
      }
    } catch (error) {
      console.error('Error acquiring job lock:', error);
      return { acquired: false, reason: 'error', error: error.message };
    }
  },

  async releaseJobLock(jobName, businessId = null, metadata = null) {
    const now = new Date();
    const whereCondition = businessId
      ? and(eq(jobLocks.jobName, jobName), eq(jobLocks.businessId, businessId))
      : and(eq(jobLocks.jobName, jobName), isNull(jobLocks.businessId));
    
    await db
      .update(jobLocks)
      .set({
        lockAcquiredAt: null,
        lockExpiresAt: null,
        status: 'completed',
        metadata,
        updatedAt: now
      })
      .where(whereCondition);
  },

  async checkJobLock(jobName, businessId = null) {
    const whereCondition = businessId
      ? and(eq(jobLocks.jobName, jobName), eq(jobLocks.businessId, businessId))
      : and(eq(jobLocks.jobName, jobName), isNull(jobLocks.businessId));
    
    const locks = await db
      .select()
      .from(jobLocks)
      .where(whereCondition)
      .limit(1);
    
    return locks.length > 0 ? locks[0] : null;
  },

  async failJobLock(jobName, businessId = null, error = null) {
    const now = new Date();
    const whereCondition = businessId
      ? and(eq(jobLocks.jobName, jobName), eq(jobLocks.businessId, businessId))
      : and(eq(jobLocks.jobName, jobName), isNull(jobLocks.businessId));
    
    await db
      .update(jobLocks)
      .set({
        lockAcquiredAt: null,
        lockExpiresAt: null,
        status: 'failed',
        metadata: error ? { error: error.message, stack: error.stack } : null,
        updatedAt: now
      })
      .where(whereCondition);
  },

  // ========== UTILS ==========
  async clearAllData() {
    // For testing only - clear all data
    await db.delete(jobLocks);
    await db.delete(media);
    await db.delete(eventRsvps);
    await db.delete(communityEvents);
    await db.delete(feedbackItems);
    await db.delete(systemLogs);
    await db.delete(referrals);
    await db.delete(betaTesters);
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

// Export convenience aliases for owner portal
export const listBusinesses = () => storage.getAllBusinesses();
export const listUsers = (businessId) => storage.getUsersByBusiness(businessId);
export const listClients = (businessId) => storage.getClientsByBusiness(businessId);
export const listJobs = (businessId) => storage.getJobsByBusiness(businessId);
export const getBusiness = (id) => storage.getBusiness(id);
export const getUser = (id) => storage.getUser(id);
export const updateBusiness = (id, updates) => storage.updateBusiness(id, updates);
export const updateUser = (id, updates) => storage.updateUser(id, updates);
export const getReferralsByReferrer = (businessId) => storage.getReferralsByReferrer(businessId);
export const logSystem = (data) => storage.logSystem(data);
export const getSystemLogs = (filters) => storage.getSystemLogs(filters);
