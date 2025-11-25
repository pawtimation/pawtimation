import { repo } from '../repo.js';
import { storage } from '../storage.js';
import { nid } from '../utils.js';
import { Client } from '@replit/object-storage';
import {
  requireAdminUser,
  requireStaffUser,
  requireClientUser,
  requireBusinessUser
} from '../lib/authHelpers.js';
import { generateSignedToken, verifySignedToken } from '../utils/signedUrls.js';
import { validateFileUpload, sanitizeFilename } from '../utils/fileValidation.js';
import { uploadRateLimitConfig, downloadRateLimitConfig } from '../middleware/uploadRateLimit.js';

// Lazy-load Object Storage client to avoid initialization errors on startup
let objectStorage = null;
function getObjectStorage() {
  if (!objectStorage) {
    try {
      objectStorage = new Client();
    } catch (error) {
      console.error('[OBJECT_STORAGE] Failed to initialize:', error.message);
      throw new Error('Object Storage not configured. Please set up Replit App Storage.');
    }
  }
  return objectStorage;
}

// Validate file type
function validateFileType(mimetype) {
  const allowed = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime'
  ];
  return allowed.includes(mimetype);
}

// Get file extension from mimetype
function getExtension(mimetype) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'video/mp4': 'mp4',
    'video/quicktime': 'mov'
  };
  return map[mimetype] || 'bin';
}

// Determine media type from mimetype
function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'IMAGE';
  if (mimetype.startsWith('video/')) return 'VIDEO';
  return 'OTHER';
}

// Generate secure signed download URL
// Uses relative URL so it works through the frontend proxy
function generateSecureDownloadUrl(fileKey, businessId) {
  const token = generateSignedToken(fileKey, businessId);
  return `/api/media/download?token=${encodeURIComponent(token)}`;
}


export async function mediaRoutes(fastify) {
  // Upload media for a job (walk photos/videos)
  fastify.post('/media/upload/job/:jobId', {
    config: { rateLimit: uploadRateLimitConfig }
  }, async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { jobId } = req.params;
    
    // Verify job exists and belongs to the business
    const job = await repo.getJob(jobId);
    if (!job || job.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Staff can only upload to their own jobs (or PENDING jobs without staff)
    if (auth.isStaff && job.staffId !== auth.user.id && job.staffId !== null) {
      return reply.code(403).send({ error: 'You can only upload media to your assigned jobs' });
    }

    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file into buffer first (needed for validation)
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Comprehensive security validation
    const validation = await validateFileUpload({
      filename: data.filename,
      mimetype: data.mimetype,
      file: fileBuffer
    });
    
    if (!validation.valid) {
      console.warn('[FILE_UPLOAD] Blocked upload:', validation.error, 'from IP:', req.ip);
      return reply.code(400).send({ error: validation.error });
    }

    // SECURITY: Generate server-side filename only (never use client input for storage keys)
    const ext = getExtension(validation.mimeType);
    const fileName = `${nid()}.${ext}`;
    const objectKey = `media/bookings/${auth.businessId}/${jobId}/${fileName}`;
    
    // Store sanitized original name only for display (NOT in storage paths)
    const displayName = sanitizeFilename((data.filename || 'upload').slice(0, 100));

    // Upload to Replit Object Storage
    const uploadResult = await getObjectStorage().uploadFromBytes(objectKey, fileBuffer);
    
    if (!uploadResult.ok) {
      console.error('Upload error:', uploadResult.error);
      return reply.code(500).send({ error: 'Failed to upload file' });
    }

    // Store object key (we'll generate signed URLs on-demand)
    const fileUrl = objectKey;

    // Create media record
    const mediaRecord = {
      id: nid(),
      businessId: auth.businessId,
      uploadedBy: auth.user.id,
      uploaderRole: auth.user.role,
      mediaType: validation.category.toUpperCase(),
      fileType: validation.mimeType,
      fileName: displayName,
      fileUrl: objectKey,
      fileSizeBytes: fileBuffer.length,
      jobId,
      dogId: null,
      userId: null,
      caption: data.fields?.caption?.value || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);
    
    // Generate signed download URL
    const downloadUrl = generateSecureDownloadUrl(fileUrl, auth.businessId);

    return { ...savedMedia, downloadUrl };
  });

  // Upload dog profile photo (no rate limit - authenticated users only)
  fastify.post('/media/upload/dog/:dogId', async (req, reply) => {
    // Allow both business users and clients
    const businessAuth = await requireBusinessUser(fastify, req, reply, true);
    const clientAuth = await requireClientUser(fastify, req, reply, true);
    
    if (!businessAuth && !clientAuth) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const { dogId } = req.params;
    
    // Verify dog exists
    const dog = await repo.getDog(dogId);
    if (!dog) {
      return reply.code(404).send({ error: 'Dog not found' });
    }
    
    const client = await repo.getClient(dog.clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Dog not found' });
    }

    // Authorization: business users can upload for any dog in their business,
    // clients can only upload for their own dogs
    if (businessAuth) {
      if (client.businessId !== businessAuth.businessId) {
        return reply.code(404).send({ error: 'Dog not found' });
      }
    } else if (clientAuth) {
      if (dog.clientId !== clientAuth.clientId) {
        return reply.code(403).send({ error: 'You can only upload photos for your own dogs' });
      }
    }

    const auth = businessAuth || clientAuth;

    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file into buffer first (needed for validation)
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Comprehensive security validation
    const validation = await validateFileUpload({
      filename: data.filename,
      mimetype: data.mimetype,
      file: fileBuffer
    });
    
    if (!validation.valid) {
      console.warn('[FILE_UPLOAD] Blocked dog photo upload:', validation.error, 'from IP:', req.ip);
      return reply.code(400).send({ error: validation.error });
    }
    
    // Additional check: only allow images for dog photos
    if (validation.category !== 'image') {
      return reply.code(400).send({ error: 'Only image files are allowed for dog photos' });
    }

    // SECURITY: Generate server-side filename only
    const ext = getExtension(validation.mimeType);
    const fileName = `${nid()}.${ext}`;
    const objectKey = `media/dogs/${auth.businessId}/${dogId}/${fileName}`;
    const displayName = sanitizeFilename((data.filename || 'dog-photo').slice(0, 100));

    // Upload to Object Storage
    const uploadResult = await getObjectStorage().uploadFromBytes(objectKey, fileBuffer);
    
    if (!uploadResult.ok) {
      return reply.code(500).send({ error: 'Failed to upload file' });
    }

    // Store object key (we'll generate signed URLs on-demand)
    const fileUrl = objectKey;

    // Delete old dog photo if exists
    const existingMedia = await storage.getMediaByDog(dogId);
    if (existingMedia && existingMedia.length > 0) {
      for (const old of existingMedia) {
        try {
          await getObjectStorage().delete(old.fileUrl);
        } catch (err) {
          console.error('Error deleting old file:', err);
        }
        await storage.deleteMedia(old.id);
      }
    }

    const mediaRecord = {
      id: nid(),
      businessId: auth.businessId,
      uploadedBy: auth.user.id,
      uploaderRole: auth.user.role,
      mediaType: validation.category.toUpperCase(),
      fileType: validation.mimeType,
      fileName: displayName,
      fileUrl: objectKey,
      fileSizeBytes: fileBuffer.length,
      jobId: null,
      dogId,
      userId: null,
      caption: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);
    
    // Generate signed download URL
    const downloadUrl = generateSecureDownloadUrl(fileUrl, auth.businessId);

    return { ...savedMedia, downloadUrl };
  });

  // Upload staff profile photo
  fastify.post('/media/upload/staff/:userId', {
    config: { rateLimit: uploadRateLimitConfig }
  }, async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { userId } = req.params;
    
    // Staff can only upload their own photo, admins can upload any staff photo
    if (auth.isStaff && userId !== auth.user.id) {
      return reply.code(403).send({ error: 'You can only upload your own profile photo' });
    }

    // Verify user exists and belongs to the business
    const user = await repo.getUser(userId);
    if (!user || user.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'User not found' });
    }

    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file into buffer first (needed for validation)
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);
    
    // Comprehensive security validation
    const validation = await validateFileUpload({
      filename: data.filename,
      mimetype: data.mimetype,
      file: fileBuffer
    });
    
    if (!validation.valid) {
      console.warn('[FILE_UPLOAD] Blocked staff photo upload:', validation.error, 'from IP:', req.ip);
      return reply.code(400).send({ error: validation.error });
    }
    
    // Additional check: only allow images for staff photos
    if (validation.category !== 'image') {
      return reply.code(400).send({ error: 'Only image files are allowed for staff photos' });
    }

    // SECURITY: Generate server-side filename only
    const ext = getExtension(validation.mimeType);
    const fileName = `${nid()}.${ext}`;
    const objectKey = `media/staff/${auth.businessId}/${userId}/${fileName}`;
    const displayName = sanitizeFilename((data.filename || 'staff-photo').slice(0, 100));

    // Upload to Object Storage
    const uploadResult = await getObjectStorage().uploadFromBytes(objectKey, fileBuffer);
    
    if (!uploadResult.ok) {
      return reply.code(500).send({ error: 'Failed to upload file' });
    }

    // Store object key (we'll generate signed URLs on-demand)
    const fileUrl = objectKey;

    // Delete old staff photo if exists
    const existingMedia = await storage.getMediaByUser(userId, 'IMAGE');
    if (existingMedia && existingMedia.length > 0) {
      for (const old of existingMedia) {
        try {
          await getObjectStorage().delete(old.fileUrl);
        } catch (err) {
          console.error('Error deleting old file:', err);
        }
        await storage.deleteMedia(old.id);
      }
    }

    const mediaRecord = {
      id: nid(),
      businessId: auth.businessId,
      uploadedBy: auth.user.id,
      uploaderRole: auth.user.role,
      mediaType: validation.category.toUpperCase(),
      fileType: validation.mimeType,
      fileName: displayName,
      fileUrl: objectKey,
      fileSizeBytes: fileBuffer.length,
      jobId: null,
      dogId: null,
      userId,
      caption: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);
    
    // Generate signed download URL
    const downloadUrl = generateSecureDownloadUrl(fileUrl, auth.businessId);

    return { ...savedMedia, downloadUrl };
  });

  // Get media for a job (supports both business users and clients)
  fastify.get('/media/job/:jobId', async (req, reply) => {
    const { jobId } = req.params;
    
    // Try business user authentication first
    const businessAuth = await requireBusinessUser(fastify, req, reply, true);
    
    if (businessAuth) {
      // Business user path (Admin or Staff)
      const job = await repo.getJob(jobId);
      if (!job) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      // Verify business isolation
      if (job.businessId !== businessAuth.businessId) {
        return reply.code(404).send({ error: 'Job not found' });
      }
      
      // Staff can only view media for jobs assigned to them (admins can view all)
      if (businessAuth.isStaff && job.staffId !== businessAuth.user.id && job.staffId !== null) {
        return reply.code(403).send({ error: 'You can only view media for your assigned jobs' });
      }

      try {
        // Fetch and enrich media with signed download URLs
        const mediaItems = await storage.getMediaByJob(jobId);
        const enriched = await Promise.all(mediaItems.map(async (item) => {
          const uploader = await repo.getUser(item.uploadedBy);
          const downloadUrl = generateSecureDownloadUrl(item.fileUrl, job.businessId);
          return {
            ...item,
            uploaderName: uploader?.name || 'Unknown',
            downloadUrl
          };
        }));

        return reply.send(enriched);
      } catch (error) {
        console.warn('[MEDIA] Failed to load job media:', error.message);
        // Return empty array if storage isn't configured yet
        return [];
      }
    }
    
    // Try client authentication
    const clientAuth = await requireClientUser(fastify, req, reply, true);
    
    if (clientAuth) {
      // Client user path
      const job = await repo.getJob(jobId);
      if (!job) {
        return reply.code(404).send({ error: 'Job not found' });
      }

      // Clients can only view media for their own jobs
      // Use the actual CRM client ID from the authenticated client user
      if (!clientAuth.user.clientId) {
        return reply.code(403).send({ error: 'Invalid client authentication' });
      }
      
      if (job.clientId !== clientAuth.user.clientId) {
        return reply.code(403).send({ error: 'You can only view media for your own bookings' });
      }

      try {
        // Fetch and enrich media with signed download URLs
        const mediaItems = await storage.getMediaByJob(jobId);
        const enriched = await Promise.all(mediaItems.map(async (item) => {
          const uploader = await repo.getUser(item.uploadedBy);
          const downloadUrl = generateSecureDownloadUrl(item.fileUrl, job.businessId);
          return {
            ...item,
            uploaderName: uploader?.name || 'Unknown',
            downloadUrl
          };
        }));

        return reply.send(enriched);
      } catch (error) {
        console.warn('[MEDIA] Failed to load job media:', error.message);
        // Return empty array if storage isn't configured yet
        return [];
      }
    }
    
    // Neither authentication succeeded
    return reply.code(401).send({ error: 'Authentication required' });
  });

  // Get media for a dog (supports both business users and clients)
  fastify.get('/media/dog/:dogId', async (req, reply) => {
    // Allow both business users and clients
    const businessAuth = await requireBusinessUser(fastify, req, reply, true);
    const clientAuth = await requireClientUser(fastify, req, reply, true);
    
    if (!businessAuth && !clientAuth) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const { dogId } = req.params;
    
    const dog = await repo.getDog(dogId);
    if (!dog) {
      return reply.code(404).send({ error: 'Dog not found' });
    }
    
    const client = await repo.getClient(dog.clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Dog not found' });
    }

    // Authorization: business users can access any dog in their business,
    // clients can only access their own dogs
    if (businessAuth) {
      if (client.businessId !== businessAuth.businessId) {
        return reply.code(404).send({ error: 'Dog not found' });
      }
    } else if (clientAuth) {
      if (dog.clientId !== clientAuth.clientId) {
        return reply.code(403).send({ error: 'You can only view photos for your own dogs' });
      }
    }

    const auth = businessAuth || clientAuth;

    try {
      const mediaItems = await storage.getMediaByDog(dogId);
      
      // Enrich with signed download URLs
      const enriched = await Promise.all(mediaItems.map(async (item) => {
        const downloadUrl = generateSecureDownloadUrl(item.fileUrl, auth.businessId);
        return {
          ...item,
          downloadUrl
        };
      }));

      return enriched;
    } catch (error) {
      console.warn('[MEDIA] Failed to load dog media:', error.message);
      // Return empty array if storage isn't configured yet
      return [];
    }
  });

  // Get media for a staff member
  fastify.get('/media/staff/:userId', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { userId } = req.params;
    
    const user = await repo.getUser(userId);
    if (!user || user.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'User not found' });
    }

    try {
      const mediaItems = await storage.getMediaByUser(userId, 'IMAGE');
      
      // Enrich with signed download URLs
      const enriched = await Promise.all(mediaItems.map(async (item) => {
        const downloadUrl = generateSecureDownloadUrl(item.fileUrl, auth.businessId);
        return {
          ...item,
          downloadUrl
        };
      }));

      return enriched;
    } catch (error) {
      console.warn('[MEDIA] Failed to load staff media:', error.message);
      // Return empty array if storage isn't configured yet
      return [];
    }
  });

  // Delete media (admin only, or staff can delete their own uploads)
  fastify.delete('/media/:mediaId', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { mediaId } = req.params;
    
    const mediaItem = await storage.getMedia(mediaId);
    if (!mediaItem || mediaItem.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'Media not found' });
    }

    // Staff can only delete media they uploaded
    if (auth.isStaff && mediaItem.uploadedBy !== auth.user.id) {
      return reply.code(403).send({ error: 'You can only delete media you uploaded' });
    }

    // Delete file from Object Storage
    try {
      await getObjectStorage().delete(mediaItem.fileUrl);
    } catch (err) {
      console.error('Error deleting file from storage:', err);
    }

    await storage.deleteMedia(mediaId);

    return { success: true };
  });

  // SECURE: Signed URL file download with audit logging (supports business users and clients)
  fastify.get('/media/download', {
    config: { rateLimit: downloadRateLimitConfig }
  }, async (req, reply) => {
    const { token } = req.query;
    
    if (!token) {
      return reply.code(400).send({ error: 'Missing download token' });
    }

    // Verify signed token
    const payload = verifySignedToken(token);
    if (!payload) {
      return reply.code(403).send({ error: 'Invalid or expired download link' });
    }

    // Additional authentication - require user to be logged in (allow both business and client)
    const businessAuth = await requireBusinessUser(fastify, req, reply, true);
    const clientAuth = await requireClientUser(fastify, req, reply, true);
    
    if (!businessAuth && !clientAuth) {
      return reply.code(401).send({ error: 'Authentication required' });
    }

    const auth = businessAuth || clientAuth;

    // Verify business access matches token
    if (payload.bid !== auth.businessId) {
      return reply.code(403).send({ error: 'Access denied: business mismatch' });
    }

    const fileKey = payload.key;
    
    try {
      // Download file from Object Storage
      const result = await getObjectStorage().downloadAsBytes(fileKey);
      if (!result.ok) {
        console.error('[FILE_DOWNLOAD] Object Storage error:', result.error);
        return reply.code(404).send({ error: 'File not found' });
      }

      // Set appropriate content type based on file extension
      const ext = fileKey.split('.').pop().toLowerCase();
      const contentTypes = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime'
      };

      reply.header('Content-Type', contentTypes[ext] || 'application/octet-stream');
      reply.header('Content-Disposition', `inline; filename="${fileKey.split('/').pop()}"`);
      
      // Send the bytes buffer
      return reply.send(Buffer.from(result.value));
    } catch (err) {
      console.error('[FILE_DOWNLOAD] Error downloading file:', err.message);
      return reply.code(500).send({ error: 'Failed to download file' });
    }
  });

  // Legacy route for backward compatibility (redirects to secure route)
  fastify.get('/media/file/:businessId/:category/*', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { businessId, category } = req.params;
    const fileName = req.params['*'];
    
    // Verify business access
    if (businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const objectKey = `media/${category}/${businessId}/${fileName}`;
    
    // Generate signed URL and redirect
    const secureUrl = generateSecureDownloadUrl(objectKey, businessId);
    return reply.redirect(301, secureUrl);
  });

  // Upload business logo
  fastify.post('/media/upload/logo', {
    config: { rateLimit: uploadRateLimitConfig }
  }, async (req, reply) => {
    const auth = await requireAdminUser(fastify, req, reply);
    if (!auth) return;

    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    // Read file into buffer
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const fileBuffer = Buffer.concat(chunks);

    // SECURITY: Use comprehensive file validation (binary sniffing, not just mimetype)
    const validation = await validateFileUpload({
      filename: data.filename,
      mimetype: data.mimetype,
      file: fileBuffer
    });
    
    if (!validation.valid) {
      console.warn('[LOGO_UPLOAD] Blocked upload:', validation.error, 'from IP:', req.ip);
      return reply.code(400).send({ error: validation.error });
    }
    
    // Additional check: logos must be images only
    if (!validation.mimeType.startsWith('image/')) {
      return reply.code(400).send({ error: 'Invalid file type. Please upload a JPG, PNG, or WebP image.' });
    }

    // Check file size (2MB max for logos)
    if (fileBuffer.length > 2 * 1024 * 1024) {
      return reply.code(400).send({ error: 'File too large. Maximum size is 2MB.' });
    }

    // Generate filename and storage key using validated mime type
    const ext = getExtension(validation.mimeType);
    const fileName = `logo_${nid()}.${ext}`;
    const objectKey = `media/branding/${auth.businessId}/${fileName}`;

    try {
      // Upload to Object Storage
      await getObjectStorage().uploadFromBytes(objectKey, fileBuffer);

      // Update business settings with ONLY the object key (not the signed URL)
      // Signed URLs are generated fresh when settings are read to avoid expiry issues
      const business = await repo.getBusiness(auth.businessId);
      if (business) {
        const currentSettings = business.settings || {};
        const currentBranding = currentSettings.branding || {};
        
        await repo.updateBusinessSettings(auth.businessId, {
          branding: {
            ...currentBranding,
            logoObjectKey: objectKey
          }
        });
      }

      // Generate fresh signed URL for immediate display
      const logoUrl = generateSecureDownloadUrl(objectKey, auth.businessId);

      console.log(`[LOGO_UPLOAD] Logo uploaded for business ${auth.businessId}: ${objectKey}`);
      
      return { 
        success: true, 
        logoUrl,
        objectKey
      };
    } catch (err) {
      console.error('[LOGO_UPLOAD] Upload failed:', err.message);
      return reply.code(500).send({ error: 'Failed to upload logo' });
    }
  });

  // Delete business logo
  fastify.delete('/media/logo', async (req, reply) => {
    const auth = await requireAdminUser(fastify, req, reply);
    if (!auth) return;

    try {
      const business = await repo.getBusiness(auth.businessId);
      const logoObjectKey = business?.settings?.branding?.logoObjectKey;

      // Delete from Object Storage if exists
      if (logoObjectKey) {
        try {
          await getObjectStorage().delete(logoObjectKey);
          console.log(`[LOGO_DELETE] Deleted logo: ${logoObjectKey}`);
        } catch (err) {
          console.warn('[LOGO_DELETE] Failed to delete from storage:', err.message);
        }
      }

      // Clear logo object key from settings (logoUrl is derived dynamically)
      const currentSettings = business?.settings || {};
      const currentBranding = currentSettings.branding || {};
      
      await repo.updateBusinessSettings(auth.businessId, {
        branding: {
          ...currentBranding,
          logoObjectKey: null
        }
      });

      return { success: true };
    } catch (err) {
      console.error('[LOGO_DELETE] Failed:', err.message);
      return reply.code(500).send({ error: 'Failed to delete logo' });
    }
  });
}
