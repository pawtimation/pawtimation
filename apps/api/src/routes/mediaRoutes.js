import { repo } from '../repo.js';
import { storage } from '../storage.js';
import { nid } from '../utils.js';
import { promisify } from 'util';
import { pipeline } from 'stream';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  requireAdminUser,
  requireStaffUser,
  requireClientUser,
  requireBusinessUser
} from '../lib/authHelpers.js';

const pump = promisify(pipeline);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Media storage directory
const MEDIA_DIR = path.join(__dirname, '../../../uploads/media');

// Ensure media directories exist
function ensureDirectories() {
  const dirs = [
    MEDIA_DIR,
    path.join(MEDIA_DIR, 'staff'),
    path.join(MEDIA_DIR, 'clients'),
    path.join(MEDIA_DIR, 'dogs'),
    path.join(MEDIA_DIR, 'bookings')
  ];
  
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
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

export async function mediaRoutes(fastify) {
  // Ensure directories exist on startup
  ensureDirectories();

  // Upload media for a job (walk photos/videos)
  fastify.post('/media/upload/job/:jobId', async (req, reply) => {
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

    // Validate file type
    if (!validateFileType(data.mimetype)) {
      return reply.code(400).send({ error: 'Invalid file type. Only JPG, PNG, WEBP, MP4, and MOV are allowed' });
    }

    // Check file size (10MB max)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
      const currentSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      if (currentSize > MAX_SIZE) {
        return reply.code(400).send({ error: 'File size exceeds 10MB limit' });
      }
    }
    const fileBuffer = Buffer.concat(chunks);

    // Generate unique filename
    const ext = getExtension(data.mimetype);
    const fileName = `${nid()}.${ext}`;
    const subfolder = 'bookings';
    const filePath = path.join(MEDIA_DIR, subfolder, fileName);
    const fileUrl = `/uploads/media/${subfolder}/${fileName}`;

    // Save file
    fs.writeFileSync(filePath, fileBuffer);

    // Create media record
    const mediaRecord = {
      id: nid(),
      businessId: auth.businessId,
      uploadedBy: auth.user.id,
      uploaderRole: auth.user.role,
      mediaType: getMediaType(data.mimetype),
      fileType: data.mimetype,
      fileName: data.filename || fileName,
      fileUrl,
      fileSizeBytes: fileBuffer.length,
      jobId,
      dogId: null,
      userId: null,
      caption: data.fields?.caption?.value || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);

    return savedMedia;
  });

  // Upload dog profile photo
  fastify.post('/media/upload/dog/:dogId', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { dogId } = req.params;
    
    // Verify dog exists and belongs to a client in the business
    const dog = await repo.getDog(dogId);
    if (!dog) {
      return reply.code(404).send({ error: 'Dog not found' });
    }
    
    const client = await repo.getClient(dog.clientId);
    if (!client || client.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'Dog not found' });
    }

    const data = await req.file();
    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    if (!validateFileType(data.mimetype) || !data.mimetype.startsWith('image/')) {
      return reply.code(400).send({ error: 'Only image files (JPG, PNG, WEBP) are allowed' });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
      const currentSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      if (currentSize > MAX_SIZE) {
        return reply.code(400).send({ error: 'File size exceeds 10MB limit' });
      }
    }
    const fileBuffer = Buffer.concat(chunks);

    const ext = getExtension(data.mimetype);
    const fileName = `${nid()}.${ext}`;
    const subfolder = 'dogs';
    const filePath = path.join(MEDIA_DIR, subfolder, fileName);
    const fileUrl = `/uploads/media/${subfolder}/${fileName}`;

    fs.writeFileSync(filePath, fileBuffer);

    // Delete old dog photo if exists
    const existingMedia = await storage.getMediaByDog(dogId);
    if (existingMedia && existingMedia.length > 0) {
      for (const old of existingMedia) {
        try {
          const oldPath = path.join(__dirname, '../../..', old.fileUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
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
      mediaType: 'IMAGE',
      fileType: data.mimetype,
      fileName: data.filename || fileName,
      fileUrl,
      fileSizeBytes: fileBuffer.length,
      jobId: null,
      dogId,
      userId: null,
      caption: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);

    return savedMedia;
  });

  // Upload staff profile photo
  fastify.post('/media/upload/staff/:userId', async (req, reply) => {
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

    if (!validateFileType(data.mimetype) || !data.mimetype.startsWith('image/')) {
      return reply.code(400).send({ error: 'Only image files (JPG, PNG, WEBP) are allowed' });
    }

    const MAX_SIZE = 10 * 1024 * 1024;
    const chunks = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
      const currentSize = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      if (currentSize > MAX_SIZE) {
        return reply.code(400).send({ error: 'File size exceeds 10MB limit' });
      }
    }
    const fileBuffer = Buffer.concat(chunks);

    const ext = getExtension(data.mimetype);
    const fileName = `${nid()}.${ext}`;
    const subfolder = 'staff';
    const filePath = path.join(MEDIA_DIR, subfolder, fileName);
    const fileUrl = `/uploads/media/${subfolder}/${fileName}`;

    fs.writeFileSync(filePath, fileBuffer);

    // Delete old staff photo if exists
    const existingMedia = await storage.getMediaByUser(userId, 'IMAGE');
    if (existingMedia && existingMedia.length > 0) {
      for (const old of existingMedia) {
        try {
          const oldPath = path.join(__dirname, '../../..', old.fileUrl);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
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
      mediaType: 'IMAGE',
      fileType: data.mimetype,
      fileName: data.filename || fileName,
      fileUrl,
      fileSizeBytes: fileBuffer.length,
      jobId: null,
      dogId: null,
      userId,
      caption: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const savedMedia = await storage.createMedia(mediaRecord);

    return savedMedia;
  });

  // Get media for a job
  fastify.get('/media/job/:jobId', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { jobId } = req.params;
    
    const job = await repo.getJob(jobId);
    if (!job || job.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    const mediaItems = await storage.getMediaByJob(jobId);
    
    // Enrich with uploader info
    const enriched = await Promise.all(mediaItems.map(async (item) => {
      const uploader = await repo.getUser(item.uploadedBy);
      return {
        ...item,
        uploaderName: uploader?.name || 'Unknown'
      };
    }));

    return enriched;
  });

  // Get media for a dog
  fastify.get('/media/dog/:dogId', async (req, reply) => {
    const auth = await requireBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { dogId } = req.params;
    
    const dog = await repo.getDog(dogId);
    if (!dog) {
      return reply.code(404).send({ error: 'Dog not found' });
    }
    
    const client = await repo.getClient(dog.clientId);
    if (!client || client.businessId !== auth.businessId) {
      return reply.code(404).send({ error: 'Dog not found' });
    }

    const mediaItems = await storage.getMediaByDog(dogId);
    return mediaItems;
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

    const mediaItems = await storage.getMediaByUser(userId, 'IMAGE');
    return mediaItems;
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

    // Delete file from filesystem
    try {
      const filePath = path.join(__dirname, '../../..', mediaItem.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error('Error deleting file:', err);
    }

    await storage.deleteMedia(mediaId);

    return { success: true };
  });
}
