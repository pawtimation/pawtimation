/**
 * GDPR Compliance Utilities
 * Implements "Right to Erasure" and "Right to Data Portability"
 */

import { storage, logSystem } from '../storage.js';
import { repo } from '../repo.js';
import { Client } from '@replit/object-storage';

// Lazy-load Object Storage client
let objectStorage = null;
function getObjectStorage() {
  if (!objectStorage) {
    objectStorage = new Client();
  }
  return objectStorage;
}

/**
 * Fields containing Personally Identifiable Information (PII)
 * Used for GDPR compliance and data export
 */
export const PII_FIELDS = {
  users: ['name', 'email', 'phone'],
  clients: ['name', 'email', 'phone', 'address', 'notes'],
  dogs: ['name', 'breed', 'behaviour', 'notes'], // Pet info is also sensitive
  invoices: ['notes'],
  jobs: ['notes'],
  messages: ['content'],
  feedbackItems: ['feedbackText', 'userName', 'userEmail'],
  systemLogs: ['metadata'], // May contain PII in metadata
};

/**
 * Export all data for a client (GDPR Right to Data Portability)
 * Returns JSON object with all personal data
 * 
 * @param {string} clientId - Client ID
 * @param {string} businessId - Business ID (for verification)
 * @returns {Object} Complete data export
 */
export async function exportClientData(clientId, businessId) {
  // Verify client belongs to business
  const client = await storage.getClient(clientId);
  if (!client || client.businessId !== businessId) {
    throw new Error('Client not found or access denied');
  }
  
  // Gather all data
  const exportData = {
    exportDate: new Date().toISOString(),
    exportType: 'GDPR_DATA_EXPORT',
    clientId,
    
    // Personal information
    profile: {
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      notes: client.notes,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt
    },
    
    // Dogs
    dogs: [],
    
    // Booking history
    bookings: [],
    
    // Invoices
    invoices: [],
    
    // Messages
    messages: [],
    
    // Media files (list of files, not actual files)
    media: []
  };
  
  // Get dogs
  const dogs = await storage.getDogsByClient(clientId);
  exportData.dogs = dogs.map(dog => ({
    name: dog.name,
    breed: dog.breed,
    age: dog.age,
    behaviour: dog.behaviour,
    notes: dog.notes,
    createdAt: dog.createdAt
  }));
  
  // Get jobs/bookings
  const jobs = await storage.getJobsByClient(clientId);
  exportData.bookings = jobs.map(job => ({
    id: job.id,
    serviceName: job.serviceId, // Would need to resolve service name
    date: job.start,
    status: job.status,
    notes: job.notes,
    completedAt: job.completedAt,
    createdAt: job.createdAt
  }));
  
  // Get invoices
  const invoices = await storage.getInvoicesByClient(clientId);
  exportData.invoices = invoices.map(invoice => ({
    id: invoice.id,
    number: invoice.invoiceNumber,
    totalCents: invoice.totalCents,
    status: invoice.status,
    dueDate: invoice.dueDate,
    paidAt: invoice.paidAt,
    notes: invoice.notes,
    createdAt: invoice.createdAt
  }));
  
  // Get messages
  const messages = await storage.getMessagesByParticipant(clientId);
  exportData.messages = messages.map(msg => ({
    content: msg.content,
    timestamp: msg.timestamp,
    isFromClient: msg.senderId === clientId
  }));
  
  // Get media files
  const media = await storage.getMediaByClient(clientId);
  exportData.media = media.map(m => ({
    type: m.mediaType,
    fileName: m.fileName,
    uploadedAt: m.createdAt,
    caption: m.caption
  }));
  
  return exportData;
}

/**
 * Delete all data for a client (GDPR Right to Erasure)
 * Permanently removes all personal data and associated records
 * 
 * @param {string} clientId - Client ID
 * @param {string} businessId - Business ID (for verification)
 * @param {Object} options - Deletion options
 * @returns {Object} Deletion summary
 */
export async function eraseClientData(clientId, businessId, options = {}) {
  const {
    keepAnonymizedRecords = true, // Keep anonymized job/invoice records for business continuity
    deleteMedia = true // Delete associated media files
  } = options;
  
  // Verify client belongs to business
  const client = await storage.getClient(clientId);
  if (!client || client.businessId !== businessId) {
    throw new Error('Client not found or access denied');
  }
  
  const deletionSummary = {
    deletedAt: new Date().toISOString(),
    clientId,
    itemsDeleted: {}
  };
  
  try {
    // 1. Delete or anonymize jobs
    const jobs = await storage.getJobsByClient(clientId);
    if (keepAnonymizedRecords) {
      // Anonymize instead of delete
      for (const job of jobs) {
        await storage.updateJob(job.id, {
          notes: '[DELETED - GDPR]',
          walkRoute: null
        });
      }
      deletionSummary.itemsDeleted.jobs = `${jobs.length} anonymized`;
    } else {
      for (const job of jobs) {
        await storage.deleteJob(job.id);
      }
      deletionSummary.itemsDeleted.jobs = `${jobs.length} deleted`;
    }
    
    // 2. Delete or anonymize invoices
    const invoices = await storage.getInvoicesByClient(clientId);
    if (keepAnonymizedRecords) {
      for (const invoice of invoices) {
        await storage.updateInvoice(invoice.id, {
          notes: '[DELETED - GDPR]'
        });
      }
      deletionSummary.itemsDeleted.invoices = `${invoices.length} anonymized`;
    } else {
      for (const invoice of invoices) {
        await storage.deleteInvoice(invoice.id);
      }
      deletionSummary.itemsDeleted.invoices = `${invoices.length} deleted`;
    }
    
    // 3. Delete messages
    const messages = await storage.getMessagesByParticipant(clientId);
    for (const message of messages) {
      await storage.deleteMessage(message.id);
    }
    deletionSummary.itemsDeleted.messages = messages.length;
    
    // 4. Delete media files
    if (deleteMedia) {
      const media = await storage.getMediaByClient(clientId);
      let mediaDeleted = 0;
      let mediaFailed = 0;
      
      for (const m of media) {
        try {
          // Validate storage key format (prevent tampering)
          if (!m.fileUrl || typeof m.fileUrl !== 'string' || m.fileUrl.includes('..')) {
            console.warn(`[GDPR] Invalid file URL for media ${m.id}, skipping file deletion`);
            mediaFailed++;
            continue;
          }
          
          // Delete from Object Storage using correct API
          const deleteResult = await getObjectStorage().delete(m.fileUrl);
          
          if (!deleteResult.ok) {
            console.error(`[GDPR] Object Storage deletion failed for ${m.id}:`, deleteResult.error);
            mediaFailed++;
          }
          
          // Delete database record (even if file deletion failed)
          await storage.deleteMedia(m.id);
          mediaDeleted++;
          
        } catch (error) {
          console.error(`[GDPR] Failed to delete media ${m.id}:`, error);
          mediaFailed++;
          
          // Log failure for audit trail
          await logSystem({
            businessId,
            logType: 'GDPR_MEDIA_DELETE_FAILED',
            severity: 'ERROR',
            message: `Failed to delete media during GDPR erasure: ${m.id}`,
            metadata: {
              clientId,
              mediaId: m.id,
              fileUrl: m.fileUrl,
              error: error.message
            }
          }).catch(err => console.error('[GDPR] Failed to log media deletion error:', err));
        }
      }
      
      deletionSummary.itemsDeleted.media = `${mediaDeleted} deleted, ${mediaFailed} failed`;
    }
    
    // 5. Delete dogs
    const dogs = await storage.getDogsByClient(clientId);
    for (const dog of dogs) {
      await storage.deleteDog(dog.id);
    }
    deletionSummary.itemsDeleted.dogs = dogs.length;
    
    // 6. Finally, delete the client record
    await storage.deleteClient(clientId);
    deletionSummary.itemsDeleted.client = 1;
    
    // Log the erasure
    await logSystem({
      businessId,
      logType: 'GDPR_ERASURE',
      severity: 'INFO',
      message: `Client data erased: ${client.name} (${client.email})`,
      metadata: {
        clientId,
        deletionSummary,
        requestedAt: new Date().toISOString()
      }
    });
    
    return deletionSummary;
    
  } catch (error) {
    console.error('[GDPR] Data erasure failed:', error);
    throw new Error('Failed to erase client data: ' + error.message);
  }
}

/**
 * Anonymize specific fields in a record
 * Replaces PII with anonymized placeholders
 */
export function anonymizeRecord(record, piiFields) {
  const anonymized = { ...record };
  
  for (const field of piiFields) {
    if (anonymized[field]) {
      if (field === 'email') {
        anonymized[field] = `deleted_${Date.now()}@deleted.local`;
      } else if (field === 'phone') {
        anonymized[field] = '[DELETED]';
      } else if (field === 'name') {
        anonymized[field] = '[Deleted User]';
      } else if (typeof anonymized[field] === 'object') {
        anonymized[field] = { deleted: true };
      } else {
        anonymized[field] = '[DELETED - GDPR]';
      }
    }
  }
  
  return anonymized;
}
