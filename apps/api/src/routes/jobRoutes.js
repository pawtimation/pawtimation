import { repo } from '../repo.js';
import { emitBookingCreated, emitBookingUpdated, emitBookingDeleted, emitStatsChanged } from '../lib/socketEvents.js';
import { generateCircularRoute } from '../services/routeGenerator.js';

// Helper to get authenticated client from JWT
async function getAuthenticatedClient(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the unified storage
    const user = await repo.getUser(payload.sub);
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
async function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the unified storage
    const user = await repo.getUser(payload.sub);
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

// Helper to enrich a job with client, service, staff, and dog details
async function enrichJob(job) {
  const client = job.clientId ? await repo.getClient(job.clientId) : null;
  const service = job.serviceId ? await repo.getService(job.serviceId) : null;
  const staffMember = job.staffId ? await repo.getUser(job.staffId) : null;
  const dogs = job.dogIds ? await Promise.all(
    job.dogIds.map(id => repo.getDog(id))
  ) : [];

  return {
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
}

export async function jobRoutes(fastify) {
  // List all bookings for authenticated business user (enriched with client/service/staff details)
  fastify.get('/bookings/list', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { staffId } = req.query;

    let jobs = await repo.listJobsByBusiness(auth.businessId);
    
    // Filter by staff if requested
    if (staffId) {
      jobs = jobs.filter(j => j.staffId === staffId);
    }

    // Enrich each job with related data
    const enrichedJobs = await Promise.all(jobs.map(enrichJob));
    
    return enrichedJobs;
  });

  // List jobs for the authenticated client
  fastify.get('/jobs/client/:clientId', async (req, reply) => {
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    
    if (job.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Only pending jobs can be cancelled' });
    }
    
    await repo.setJobStatus(id, 'CANCELLED');
    
    return { success: true };
  });

  // Get a single job (only if owned by the authenticated client)
  fastify.get('/jobs/:id', async (req, reply) => {
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    
    if (job.status !== 'PENDING') {
      return reply.code(400).send({ error: 'Only pending jobs can be edited' });
    }
    
    const updated = await repo.updateJob(id, {
      start,
      dogIds,
      notes
    });
    
    emitBookingUpdated(updated);
    
    return { job: updated };
  });

  // List dogs for the authenticated client
  fastify.get('/clients/:clientId/dogs', async (req, reply) => {
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    const auth = await getAuthenticatedClient(fastify, req, reply);
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
    
    // Create the job with PENDING status (awaiting approval) and auto-set price from service
    const job = await repo.createJob({
      businessId,
      clientId,
      serviceId,
      dogIds,
      start,
      notes: notes || '',
      status: 'PENDING',
      priceCents: service?.priceCents ?? 0   // Auto-set price from service
    });
    
    emitBookingCreated(job);
    
    return { job };
  });

  // Create recurring bookings (for business/admin users)
  fastify.post('/bookings/create-recurring', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId, serviceId, dogIds, start, notes, staffId, recurrence, recurrenceEndDate, recurrenceInterval } = req.body;
    
    // Validation
    if (!clientId || !serviceId || !start || !recurrence || recurrence === 'none') {
      return reply.code(400).send({ error: 'Missing required fields for recurring booking' });
    }
    
    if (!recurrenceEndDate) {
      return reply.code(400).send({ error: 'End date required for recurring bookings' });
    }
    
    // Verify client and service
    const client = await repo.getClient(clientId);
    if (!client || client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: client not found in your business' });
    }
    
    const service = await repo.getService(serviceId);
    if (!service || service.businessId !== auth.businessId) {
      return reply.code(400).send({ error: 'Invalid service' });
    }
    
    // Calculate interval in days
    let intervalDays = 1;
    if (recurrence === 'daily') intervalDays = 1;
    else if (recurrence === 'weekly') intervalDays = 7;
    else if (recurrence === 'biweekly') intervalDays = 14;
    else if (recurrence === 'custom') intervalDays = recurrenceInterval || 1;
    
    // Generate all dates
    const startDate = new Date(start);
    const endDate = new Date(recurrenceEndDate);
    endDate.setHours(23, 59, 59, 999); // End of day
    
    const dates = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + intervalDays);
      
      // Safety limit: max 100 occurrences
      if (dates.length >= 100) break;
    }
    
    if (dates.length === 0) {
      return reply.code(400).send({ error: 'No valid dates generated' });
    }
    
    // Create jobs for each date
    const createdJobs = [];
    const errors = [];
    
    for (const date of dates) {
      try {
        // Calculate end time
        const endTime = new Date(date);
        if (service.durationMinutes) {
          endTime.setMinutes(endTime.getMinutes() + service.durationMinutes);
        }
        
        // Determine staff for this slot
        let assignedStaffId = staffId;
        
        if (!assignedStaffId) {
          // Auto-assign staff using availability check with service qualification
          const availableStaff = await repo.findAvailableStaffForSlot(
            auth.businessId,
            date.toISOString(),
            endTime.toISOString(),
            serviceId
          );
          
          if (availableStaff.length > 0) {
            assignedStaffId = availableStaff[0].id;
          }
        }
        
        // Create the job
        const job = await repo.createJob({
          businessId: auth.businessId,
          clientId,
          serviceId,
          dogIds: dogIds || [],
          start: date.toISOString(),
          notes: notes || '',
          status: 'BOOKED',
          priceCents: service?.priceCents ?? 0,
          staffId: assignedStaffId || null
        });
        
        emitBookingCreated(job);
        
        createdJobs.push(job);
      } catch (err) {
        errors.push({ date: date.toISOString(), error: err.message });
      }
    }
    
    return {
      success: true,
      created: createdJobs.length,
      total: dates.length,
      jobs: createdJobs,
      errors: errors.length > 0 ? errors : undefined
    };
  });

  // Create a new booking (for business/admin users)
  // This endpoint allows admins to create bookings on behalf of clients
  fastify.post('/bookings/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId, serviceId, dogIds, start, notes, status, staffId } = req.body;
    
    // Validation
    if (!clientId) {
      return reply.code(400).send({ error: 'Client ID required' });
    }
    
    if (!serviceId) {
      return reply.code(400).send({ error: 'Service ID required' });
    }
    
    // Verify client belongs to the business
    const client = await repo.getClient(clientId);
    if (!client || client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: client not found in your business' });
    }
    
    // Verify the service exists and belongs to the business
    const service = await repo.getService(serviceId);
    if (!service || service.businessId !== auth.businessId) {
      return reply.code(400).send({ error: 'Invalid service' });
    }
    
    if (!start) {
      return reply.code(400).send({ error: 'Start time required' });
    }
    
    // Verify dogs belong to the specified client (if any provided)
    if (dogIds && dogIds.length > 0) {
      const clientDogs = await repo.listDogsByClient(clientId);
      const clientDogIds = new Set(clientDogs.map(d => d.id));
      
      for (const dogId of dogIds) {
        if (!clientDogIds.has(dogId)) {
          return reply.code(400).send({ error: 'One or more dogs do not belong to this client' });
        }
      }
    }
    
    // Verify staffId if provided
    if (staffId) {
      const staffMember = await repo.getUser(staffId);
      if (!staffMember || staffMember.businessId !== auth.businessId || staffMember.role !== 'STAFF') {
        return reply.code(400).send({ error: 'Invalid staff member' });
      }
    }
    
    // Create the job with specified status (default to BOOKED for admin-created bookings)
    const job = await repo.createJob({
      businessId: auth.businessId,
      clientId,
      serviceId,
      dogIds: dogIds || [],
      start,
      notes: notes || '',
      status: status || 'BOOKED',
      priceCents: service?.priceCents ?? 0,
      staffId: staffId || null
    });
    
    emitBookingCreated(job);
    
    return { job };
  });

  // List all pending jobs (for business/admin approval)
  fastify.get('/jobs/pending', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const jobs = await repo.listJobs({ status: 'PENDING' });
    
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

  // Approve a job (change status from PENDING to BOOKED)
  fastify.post('/jobs/approve', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
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
    
    // Auto-assign staff if not already assigned
    let staffId = job.staffId;
    if (!staffId && job.serviceId && job.start) {
      const service = await repo.getService(job.serviceId);
      if (service?.durationMinutes) {
        const startDate = new Date(job.start);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
        
        // Use findAvailableStaffForSlot with proper signature (businessId, startIso, endIso, serviceId)
        const availableStaff = await repo.findAvailableStaffForSlot(
          auth.businessId,
          startDate.toISOString(),
          endDate.toISOString(),
          job.serviceId
        );
        
        if (availableStaff.length > 0) {
          // Pick the first available staff member
          staffId = availableStaff[0].id;
        }
      }
    }
    
    const updated = await repo.updateJob(id, { 
      status: 'BOOKED',
      staffId: staffId || job.staffId || null
    });
    
    emitBookingUpdated(updated);
    
    return { job: updated };
  });

  // Decline a job (change status to CANCELLED)
  fastify.post('/jobs/decline', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
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
    
    emitBookingUpdated(updated);
    
    return { job: updated };
  });

  // Get bookings for a specific date (for calendar view)
  fastify.get('/bookings/by-date', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
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
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
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
    const enrichedJob = await enrichJob(job);

    reply.send(enrichedJob);
  });

  // Quick update booking time (for drag-and-drop) - lightweight endpoint
  fastify.post('/bookings/:bookingId/move', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { bookingId } = req.params;
    const { start } = req.body;

    if (!start) {
      return reply.code(400).send({ error: 'Start time required' });
    }

    let job = await repo.getJob(bookingId);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update jobs from other businesses' });
    }

    // Recalculate end time based on service duration
    const service = await repo.getService(job.serviceId);
    const patch = { start };
    
    if (service?.durationMinutes) {
      const startDate = new Date(start);
      const endDate = new Date(startDate);
      endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
      patch.end = endDate.toISOString();
    }

    job = await repo.updateJob(bookingId, patch);

    emitBookingUpdated(job);
    emitStatsChanged();

    // Return enriched job for UI update
    const enrichedJob = await enrichJob(job);
    reply.send({ success: true, booking: enrichedJob });
  });

  // Update a booking (for business/admin) - now with auto-invoicing on completion
  fastify.post('/bookings/:bookingId/update', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { bookingId } = req.params;
    const { start, serviceId, staffId, status, priceCents } = req.body;

    let job = await repo.getJob(bookingId);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update jobs from other businesses' });
    }

    // 1) If status changed → use setJobStatus() (auto-invoice fires here)
    if (status && status !== job.status) {
      job = await repo.setJobStatus(bookingId, status);
    }

    // 2) Apply other field updates via updateJob (including price override)
    const patch = {};
    if (start) patch.start = start;
    if (serviceId) patch.serviceId = serviceId;
    if (staffId !== undefined) patch.staffId = staffId;
    if (priceCents !== undefined) patch.priceCents = priceCents;

    // 3) Recalculate end time if start or serviceId changed
    if (start || serviceId) {
      const finalServiceId = serviceId || job.serviceId;
      const finalStart = start || job.start;
      
      const service = await repo.getService(finalServiceId);
      if (service?.durationMinutes) {
        const startDate = new Date(finalStart);
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + service.durationMinutes);
        patch.end = endDate.toISOString();
      }
    }

    if (Object.keys(patch).length > 0) {
      job = await repo.updateJob(bookingId, patch);
    }

    emitBookingUpdated(job);
    emitStatsChanged();

    reply.send({ success: true, booking: job });
  });

  // Generate walking route for a booking
  fastify.post('/bookings/:bookingId/generate-route', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { bookingId } = req.params;

    const job = await repo.getJob(bookingId);
    if (!job) {
      return reply.code(404).send({ error: 'Booking not found' });
    }

    // Verify the job belongs to the authenticated user's business
    if (job.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access bookings from other businesses' });
    }

    // Get client to check for coordinates
    const client = await repo.getClient(job.clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    if (!client.lat || !client.lng) {
      return reply.code(400).send({ 
        error: 'Client address coordinates not available. Please add a valid address to the client profile.' 
      });
    }

    // Get service duration
    const service = await repo.getService(job.serviceId);
    if (!service || !service.durationMinutes) {
      return reply.code(400).send({ 
        error: 'Service duration not available' 
      });
    }

    // Generate the route
    const route = generateCircularRoute(client.lat, client.lng, service.durationMinutes);

    // Update the job with the route
    await repo.updateJob(bookingId, { route });

    emitBookingUpdated(job);

    reply.send({ 
      success: true, 
      route,
      booking: await repo.getJob(bookingId)
    });
  });
}
