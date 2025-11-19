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

// Helper to verify authenticated business/admin user
function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the payload
    const user = [...users.values()].find(u => u.id === payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
    // Verify this is an admin or business user (not a client)
    if (user.role === 'client') {
      reply.code(403).send({ error: 'forbidden: admin access required' });
      return null;
    }
    
    return { user, businessId: user.businessId };
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

  // Create a new job request (booking)
  fastify.post('/jobs/create', async (req, reply) => {
    const auth = getAuthenticatedClient(fastify, req, reply);
    if (!auth) return;
    
    const { clientId, businessId, serviceId, dogIds, start, notes } = req.body;
    
    // Verify the clientId in the request matches the authenticated client
    if (clientId !== auth.clientId) {
      return reply.code(403).send({ error: 'forbidden: cannot create jobs for other clients' });
    }
    
    // Validation
    if (!businessId) {
      return reply.code(400).send({ error: 'Business ID required' });
    }
    
    if (!serviceId) {
      return reply.code(400).send({ error: 'Service ID required' });
    }
    
    if (!dogIds || dogIds.length === 0) {
      return reply.code(400).send({ error: 'At least one dog must be selected' });
    }
    
    if (!start) {
      return reply.code(400).send({ error: 'Start time required' });
    }
    
    // Verify that all dogs belong to the authenticated client
    const dogs = await repo.listDogsByClient(clientId);
    const clientDogIds = new Set(dogs.map(d => d.id));
    
    for (const dogId of dogIds) {
      if (!clientDogIds.has(dogId)) {
        return reply.code(403).send({ error: 'forbidden: cannot create bookings with dogs you do not own' });
      }
    }
    
    // Verify the service exists and belongs to the business
    const service = await repo.getService(serviceId);
    if (!service || service.businessId !== businessId) {
      return reply.code(400).send({ error: 'Invalid service' });
    }
    
    // Create the job with REQUESTED status (pending approval)
    const job = await repo.createJob({
      businessId,
      clientId,
      serviceId,
      dogIds,
      start,
      notes: notes || '',
      status: 'REQUESTED'
    });
    
    return { job };
  });

  // List all pending jobs (for business/admin approval)
  fastify.get('/jobs/pending', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const jobs = await repo.listJobs({ status: 'REQUESTED' });
    
    // Filter jobs to only show those from the authenticated user's business
    const businessJobs = jobs.filter(job => job.businessId === auth.businessId);
    
    // Enrich with client and service details
    const enrichedJobs = await Promise.all(
      businessJobs.map(async (job) => {
        const client = job.clientId ? await repo.getClient(job.clientId) : null;
        const service = job.serviceId ? await repo.getService(job.serviceId) : null;
        const dogs = job.dogIds ? await Promise.all(
          job.dogIds.map(id => repo.getDog(id))
        ) : [];
        
        return {
          ...job,
          client,
          serviceName: service?.name || 'Service',
          dogs: dogs.filter(Boolean)
        };
      })
    );
    
    return enrichedJobs;
  });

  // Approve a job (change status from REQUESTED to APPROVED)
  fastify.post('/jobs/approve', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.body;
    
    if (!id) {
      return reply.code(400).send({ error: 'Job ID required' });
    }
    
    const job = await repo.getJob(id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }
    
    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot approve jobs from other businesses' });
    }
    
    const updated = await repo.updateJob(id, { status: 'APPROVED' });
    return { job: updated };
  });

  // Decline a job (change status to CANCELLED)
  fastify.post('/jobs/decline', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { id } = req.body;
    
    if (!id) {
      return reply.code(400).send({ error: 'Job ID required' });
    }
    
    const job = await repo.getJob(id);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }
    
    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot decline jobs from other businesses' });
    }
    
    const updated = await repo.updateJob(id, { status: 'CANCELLED' });
    return { job: updated };
  });

  // Get bookings for a specific date (for calendar view)
  fastify.get('/bookings/by-date', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { date } = req.query;
    
    if (!date) {
      return reply.code(400).send({ error: 'Missing date' });
    }

    const results = await repo.getBookingsForDate(auth.businessId, date);
    reply.send(results);
  });

  // Get a single booking by ID (for business/admin)
  fastify.get('/bookings/:bookingId', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { bookingId } = req.params;
    const job = await repo.getJob(bookingId);

    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access jobs from other businesses' });
    }

    // Enrich with client, service, staff, and dog details
    const client = job.clientId ? await repo.getClient(job.clientId) : null;
    const service = job.serviceId ? await repo.getService(job.serviceId) : null;
    const staffMember = job.staffId ? await repo.getUser(job.staffId) : null;
    const dogs = job.dogIds ? await Promise.all(
      job.dogIds.map(id => repo.getDog(id))
    ) : [];

    const enrichedJob = {
      ...job,
      clientName: client?.name || 'Unknown Client',
      addressLine1: client?.addressLine1 || '',
      serviceName: service?.name || 'Unknown Service',
      staffName: staffMember?.name || null,
      dogs: dogs.filter(Boolean).map(d => ({
        dogId: d.id,
        name: d.name
      }))
    };

    reply.send(enrichedJob);
  });

  // Update a booking (for business/admin) - now with auto-invoicing on completion
  fastify.post('/bookings/:bookingId/update', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { bookingId } = req.params;
    const { start, serviceId, staffId, status } = req.body;

    const job = await repo.getJob(bookingId);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update jobs from other businesses' });
    }

    // Split status change from other updates so we can use setJobStatus (which auto-generates invoices)
    let updated = job;

    // 1) Handle status change via setJobStatus (triggers auto-invoice if status === COMPLETED/COMPLETE)
    if (status) {
      updated = await repo.setJobStatus(bookingId, status);
    }

    // 2) Apply other field updates via updateJob
    const patch = {};
    if (start) patch.start = start;
    if (serviceId) patch.serviceId = serviceId;
    if (staffId !== undefined) patch.staffId = staffId;

    if (Object.keys(patch).length > 0) {
      // keep whatever status setJobStatus applied
      updated = await repo.updateJob(bookingId, {
        ...patch,
        status: updated.status
      });
    }

    reply.send({ success: true, booking: updated });
  });
}
