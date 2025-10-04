import { nanoid } from 'nanoid';
import getRawBody from 'raw-body';

// In-memory storage for images (MVP - replace with cloud storage in production)
const images = new Map(); // key: imageId, value: { id, dataUrl, type, uploadedAt }

export default async function uploadRoutes(app) {
  
  // Upload an image (multipart or base64)
  app.post('/upload/image', async (req, reply) => {
    try {
      const contentType = req.headers['content-type'] || '';
      
      // Handle base64 JSON upload
      if (contentType.includes('application/json')) {
        const { dataUrl, filename } = req.body;
        if (!dataUrl || !dataUrl.startsWith('data:image/')) {
          return reply.code(400).send({ error: 'Invalid image data' });
        }
        
        const imageId = `img_${nanoid(12)}`;
        const imageType = dataUrl.split(';')[0].split(':')[1];
        
        images.set(imageId, {
          id: imageId,
          dataUrl,
          type: imageType,
          filename: filename || 'uploaded.png',
          uploadedAt: Date.now()
        });
        
        return { imageId, url: dataUrl };
      }
      
      // Handle raw binary upload
      if (contentType.includes('image/')) {
        const buffer = await getRawBody(req.raw, {
          length: req.headers['content-length'],
          limit: '10mb'
        });
        
        const base64 = buffer.toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        const imageId = `img_${nanoid(12)}`;
        
        images.set(imageId, {
          id: imageId,
          dataUrl,
          type: contentType,
          filename: req.headers['x-filename'] || 'uploaded',
          uploadedAt: Date.now()
        });
        
        return { imageId, url: dataUrl };
      }
      
      return reply.code(400).send({ error: 'Unsupported content type' });
    } catch (err) {
      app.log.error(err);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });

  // Get image by ID
  app.get('/upload/image/:imageId', async (req, reply) => {
    const { imageId } = req.params;
    const image = images.get(imageId);
    
    if (!image) {
      return reply.code(404).send({ error: 'Image not found' });
    }
    
    return { image };
  });

  // Delete image
  app.delete('/upload/image/:imageId', async (req, reply) => {
    const { imageId } = req.params;
    const existed = images.has(imageId);
    images.delete(imageId);
    
    return { deleted: existed };
  });
}
