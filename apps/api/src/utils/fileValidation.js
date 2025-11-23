/**
 * File Upload Security Validation
 * Prevents upload of malicious files and enforces size/type limits
 */

import path from 'path';
import { fileTypeFromBuffer } from 'file-type';

// Maximum file sizes (in bytes)
const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB for images
  video: 100 * 1024 * 1024, // 100MB for videos
  document: 5 * 1024 * 1024, // 5MB for documents
  default: 10 * 1024 * 1024 // 10MB default
};

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  // Images
  'image/jpeg': { extensions: ['.jpg', '.jpeg'], category: 'image' },
  'image/png': { extensions: ['.png'], category: 'image' },
  'image/gif': { extensions: ['.gif'], category: 'image' },
  'image/webp': { extensions: ['.webp'], category: 'image' },
  
  // Videos
  'video/mp4': { extensions: ['.mp4'], category: 'video' },
  'video/quicktime': { extensions: ['.mov'], category: 'video' },
  'video/x-msvideo': { extensions: ['.avi'], category: 'video' },
  
  // Documents
  'application/pdf': { extensions: ['.pdf'], category: 'document' },
  'application/msword': { extensions: ['.doc'], category: 'document' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { extensions: ['.docx'], category: 'document' },
};

// Magic number signatures for file type verification
const MAGIC_NUMBERS = {
  // Images
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF8
  'image/webp': [
    // WEBP must have RIFF header followed by WEBP signature
    [0x52, 0x49, 0x46, 0x46, null, null, null, null, 0x57, 0x45, 0x42, 0x50] // RIFF....WEBP
  ],
  
  // Videos - MP4/MOV must have ftyp box
  'video/mp4': [
    // MP4 files have ftyp box signature
    [null, null, null, null, 0x66, 0x74, 0x79, 0x70] // ....ftyp (first 4 bytes are size)
  ],
  'video/quicktime': [
    // QuickTime files also use ftyp box or moov
    [null, null, null, null, 0x66, 0x74, 0x79, 0x70], // ....ftyp
    [null, null, null, null, 0x6D, 0x6F, 0x6F, 0x76], // ....moov
    [null, null, null, null, 0x77, 0x69, 0x64, 0x65]  // ....wide
  ],
  
  // Documents
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

// Dangerous file patterns to block
const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', // Executables
  '.msi', '.app', '.deb', '.rpm', // Installers
  '.sh', '.bash', '.zsh', // Scripts
  '.js', '.vbs', '.wsf', '.hta', // Script files
  '.zip', '.rar', '.7z', '.tar', '.gz', // Archives (potential zip bombs)
];

/**
 * Validate file upload
 * 
 * @param {Object} file - Fastify file object
 * @param {string} file.filename - Original filename
 * @param {string} file.mimetype - MIME type
 * @param {number} file.file.bytesRead - File size
 * @param {Buffer} file.file - Readable stream or buffer
 * @returns {Object} Validation result { valid: boolean, error?: string, category?: string }
 */
export async function validateFileUpload(file) {
  try {
    // 1. Check if file exists
    if (!file || !file.filename) {
      return { valid: false, error: 'No file provided' };
    }

    // 2. Check file extension
    const ext = path.extname(file.filename).toLowerCase();
    
    // Block dangerous extensions
    if (BLOCKED_EXTENSIONS.includes(ext)) {
      return { valid: false, error: `File type ${ext} is not allowed for security reasons` };
    }

    // 3. Get file buffer for validation
    const buffer = Buffer.isBuffer(file.file) ? file.file : await readFirstBytes(file.file, 12);
    
    if (!buffer || buffer.length === 0) {
      return { valid: false, error: 'Could not read file content for validation' };
    }

    // 4. SECURITY: Detect MIME type authoritatively from file content (NOT client input)
    const detectedType = await fileTypeFromBuffer(buffer);
    const authoritativeMimeType = detectedType?.mime || null;
    
    // Fall back to magic number check if file-type doesn't recognize it
    let mimeType = authoritativeMimeType;
    
    if (!mimeType) {
      // Try client-provided MIME but verify with magic numbers
      const clientMime = file.mimetype?.toLowerCase();
      if (clientMime && verifyMagicNumber(buffer, clientMime)) {
        mimeType = clientMime;
      } else {
        return { valid: false, error: 'Could not determine file type from content' };
      }
    }
    
    // 5. Validate against allowed types
    const allowedType = ALLOWED_MIME_TYPES[mimeType];
    
    if (!allowedType) {
      return { valid: false, error: `File type ${mimeType} is not allowed` };
    }

    // 6. Validate extension matches detected MIME type
    // For images, allow any image extension if both detected type and extension are valid image types
    if (!allowedType.extensions.includes(ext)) {
      const isImageCategory = allowedType.category === 'image';
      const extIsImageType = Object.values(ALLOWED_MIME_TYPES)
        .some(type => type.category === 'image' && type.extensions.includes(ext));
      
      if (isImageCategory && extIsImageType) {
        // Both are valid image types, just different formats - allow it with a warning
        console.warn(`[FILE_VALIDATION] Extension mismatch: ${ext} file detected as ${mimeType}, but both are valid image types - allowing upload`);
      } else {
        return { valid: false, error: `File extension ${ext} does not match detected type ${mimeType}` };
      }
    }

    // 7. Check file size
    const fileSize = Buffer.isBuffer(file.file) 
      ? file.file.length 
      : (file.file?.bytesRead || file.file?.length || 0);
    const maxSize = MAX_FILE_SIZES[allowedType.category] || MAX_FILE_SIZES.default;
    
    if (fileSize === 0) {
      return { valid: false, error: 'File is empty or size could not be determined' };
    }
    
    if (fileSize > maxSize) {
      const maxSizeMB = Math.round(maxSize / 1024 / 1024);
      return { valid: false, error: `File size exceeds ${maxSizeMB}MB limit` };
    }

    return { 
      valid: true, 
      category: allowedType.category,
      mimeType, // Return authoritatively detected MIME type
      size: fileSize
    };

  } catch (error) {
    console.error('[FILE_VALIDATION] Error validating file:', error);
    return { valid: false, error: 'File validation failed' };
  }
}

/**
 * Read first N bytes from a readable stream
 */
async function readFirstBytes(stream, count) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let bytesRead = 0;

    stream.on('data', (chunk) => {
      chunks.push(chunk);
      bytesRead += chunk.length;
      
      if (bytesRead >= count) {
        stream.pause();
        stream.destroy();
        resolve(Buffer.concat(chunks).slice(0, count));
      }
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).slice(0, count));
    });

    stream.on('error', reject);
  });
}

/**
 * Verify file magic number (first bytes) matches expected type
 * Supports null bytes in signature for wildcard matching
 */
function verifyMagicNumber(buffer, mimeType) {
  const signatures = MAGIC_NUMBERS[mimeType];
  
  if (!signatures) {
    // No magic number defined, skip verification
    return true;
  }

  // Check if any signature matches
  return signatures.some(signature => {
    return signature.every((byte, index) => {
      // null in signature means "any byte" (wildcard)
      if (byte === null) return true;
      return buffer[index] === byte;
    });
  });
}

/**
 * Sanitize filename (strict whitelist for display only - NEVER use for storage paths)
 * SECURITY: This is for display metadata only. Storage keys must be generated server-side.
 */
export function sanitizeFilename(filename) {
  if (!filename || typeof filename !== 'string') return 'file';
  
  // Remove path traversal attempts
  const basename = path.basename(filename);
  
  // Strict character whitelist: alphanumeric, dash, underscore, single dot for extension
  let safe = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Only allow safe chars
    .replace(/\.{2,}/g, '.') // Collapse multiple dots
    .replace(/^\.+/, '') // Remove leading dots (traversal)
    .replace(/\.+$/, ''); // Remove trailing dots
  
  // Enforce reasonable length (prevent log/DB pollution)
  if (safe.length > 100) {
    safe = safe.slice(0, 100);
  }
  
  return safe || 'file';
}

/**
 * Check if file category matches expected type
 */
export function validateFileCategory(file, expectedCategory) {
  const mimeType = file.mimetype?.toLowerCase();
  const allowedType = ALLOWED_MIME_TYPES[mimeType];
  
  return allowedType?.category === expectedCategory;
}
