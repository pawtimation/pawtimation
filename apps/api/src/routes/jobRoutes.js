import { repo } from '../repo.js';
import { users } from '../authRoutes.js';

// Helper to get authenticated client from JWT
function getAuthenticatedClient(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the payload
    const user = [...users.values()].find(u => u.id === payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
    // Verify this is a client user with a CRM client record
    if (user.role !== 'client' || !user.crmClientId) {
      reply.code(403).send({ error: 'forbidden' });
      return null;
    }
    
    return { user, clientId: user.crmClientId };
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export async function jobRoutes(fastify) {
  // List jobs for the authenticated client
  fastify.get('/jobs/client/:clientId', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    
    // Verify the requested clientId matches the authenticated client
    if (clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other clients\' jobs' });
    }
    
    const jobs = await repo.listJobsByClient(clientId);
    
    const enrichedJobs = await Promise.all(
      jobs.map(async (job) => {
        const service = job.serviceId ? await repo.getService(job.serviceId) : null;
        return {
          ...job,
          serviceName: service?.name || 'Service',
          durationMinutes: service?.durationMinutes || 60
        };
      })
    );
    
    return { jobs: enrichedJobs };
  });

  // Cancel a booking (only the owner can cancel their own bookings)
  fastify.post('/jobs/cancel', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.body;
    
    if (!id) {
      return reply.code(400).send({ error: 'Job ID required' });
    }
    
    const job = await repo.getJob(id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }
    
    // Verify the job belongs to the authenticated client
    if (job.clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot cancel other clients\' jobs' });
    }
    
    if (job.status !== 'REQUESTED' && job.status !== 'pending') {
      return reply.code(400).send({ error: 'Only pending jobs can be cancelled' });
    }
    
    await repo.setJobStatus(id, 'CANCELLED');
    
    return { success: true };
  });

  // Get a single job (only if owned by the authenticated client)
  fastify.get('/jobs/:id', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.params;
    const job = await repo.getJob(id);
    
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }
    
    // Verify the job belongs to the authenticated client
    if (job.clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other clients\' jobs' });
    }
    
    return { job };
  });

  // Update a booking (only the owner can update their own bookings)
  fastify.post('/jobs/update', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { id, start, dogIds, notes } = req.body;
    
    if (!id) {
      return reply.code(400).send({ error: 'Job ID required' });
    }
    
    const job = await repo.getJob(id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }
    
    // Verify the job belongs to the authenticated client
    if (job.clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other clients\' jobs' });
    }
    
    if (job.status !== 'REQUESTED' && job.status !== 'pending') {
      return reply.code(400).send({ error: 'Only pending jobs can be edited' });
    }
    
    const updated = await repo.updateJob(id, {
      start,
      dogIds,
      notes
    });
    
    return { job: updated };
  });

  // List dogs for the authenticated client
  fastify.get('/clients/:clientId/dogs', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    
    // Verify the requested clientId matches the authenticated client
    if (clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other clients\' dogs' });
    }
    
    const dogs = await repo.listDogsByClient(clientId);
    return { dogs };
  });
}
