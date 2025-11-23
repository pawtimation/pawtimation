import { repo } from '../repo.js';
import { geocodeAddress, buildFullAddress } from '../services/geocodingService.js';
import { emitBookingCreated, emitStatsChanged } from '../lib/socketEvents.js';

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

// Helper to verify authenticated user (business user OR client)
async function getAuthenticatedUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    // Get the user from the unified storage
    const user = await repo.getUser(payload.sub);
    if (!user) {
      // JWT is valid but user was deleted - forbidden access
      reply.code(403).send({ error: 'forbidden: user account not found' });
      return null;
    }
    
    // Resolve businessId: try user record first, then client record for clients
    let resolvedBizId = user.businessId || null;
    
    if (user.role === 'client') {
      if (!user.crmClientId) {
        reply.code(403).send({ error: 'forbidden: client record not linked' });
        return null;
      }
      
      // If businessId not in user record, fetch from client record
      if (!resolvedBizId) {
        const clientRecord = await repo.getClient(user.crmClientId);
        if (!clientRecord) {
          reply.code(404).send({ error: 'client record not found' });
          return null;
        }
        resolvedBizId = clientRecord.businessId || null;
      }
      
      // businessId is required for all operations
      if (!resolvedBizId) {
        reply.code(403).send({ error: 'forbidden: business context missing' });
        return null;
      }
      
      return {
        user,
        crmClientId: user.crmClientId,
        businessId: resolvedBizId,
        hasBusinessContext: true
      };
    } else {
      // For staff/admin, require businessId
      if (!resolvedBizId) {
        reply.code(403).send({ error: 'forbidden: business context missing' });
        return null;
      }
      
      return {
        user,
        crmClientId: user.crmClientId || null,
        businessId: resolvedBizId,
        hasBusinessContext: true
      };
    }
  } catch (err) {
    // JWT verification failed or token is missing
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export async function clientRoutes(fastify) {
  // List all clients for a business
  fastify.get('/clients/list', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const clients = await repo.listClientsByBusiness(auth.businessId);
    
    // Add computed address field for display
    const clientsWithAddress = clients.map(client => {
      const addressParts = [
        client.addressLine1,
        client.city,
        client.postcode
      ].filter(Boolean);
      
      return {
        ...client,
        address: addressParts.length > 0 ? addressParts.join(', ') : client.address || ''
      };
    });
    
    return clientsWithAddress;
  });

  // Create a new client
  fastify.post('/clients/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    // Check plan limits before creating client
    const { canAddClient } = await import('../helpers/planEnforcement.js');
    const clientCheck = await canAddClient(repo, auth.businessId);
    if (!clientCheck.success) {
      console.log(`[PLAN ENFORCEMENT] Client creation blocked for business ${auth.businessId}: ${clientCheck.error}`);
      return reply.code(403).send({ 
        error: clientCheck.error,
        limit: clientCheck.limit,
        current: clientCheck.current
      });
    }

    const clientData = {
      ...req.body,
      businessId: auth.businessId
    };

    // Auto-geocode address if coordinates not provided
    if (!clientData.lat || !clientData.lng) {
      const fullAddress = buildFullAddress(clientData);
      if (fullAddress) {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          clientData.lat = coords.lat;
          clientData.lng = coords.lng;
          console.log(`✓ Auto-geocoded client address: ${fullAddress} -> ${coords.lat}, ${coords.lng}`);
        } else {
          console.log(`⚠ Could not geocode address: ${fullAddress}`);
        }
      }
    }

    const newClient = await repo.createClient(clientData);
    return { client: newClient };
  });

  // Get a single client - Allows both business users AND clients to access their own data
  fastify.get('/clients/:clientId', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
      
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Allow access if:
    // 1. User is admin/staff in the same business
    // 2. User is a client accessing their own data
    const isAdminOrStaff = auth.user.role !== 'client' && auth.businessId === client.businessId;
    const isOwnProfile = auth.user.role === 'client' && auth.crmClientId === clientId;
    
    if (!isAdminOrStaff && !isOwnProfile) {
      return reply.code(403).send({ error: 'forbidden: cannot access this client' });
    }

    return client;
  });

  // Update a client - Allows both business users AND clients to update their own data
  fastify.post('/clients/:clientId/update', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Allow access if:
    // 1. User is a client updating their own data (primary check - don't need businessId match)
    // 2. User is admin/staff in the same business
    const isOwnProfile = auth.user.role === 'client' && auth.crmClientId === clientId;
    const isAdminOrStaff = auth.user.role !== 'client' && auth.businessId && client.businessId && auth.businessId === client.businessId;
    
    if (!isOwnProfile && !isAdminOrStaff) {
      return reply.code(403).send({ error: 'forbidden: cannot update other clients' });
    }

    const updateData = { ...req.body };

    // Auto-geocode if address fields changed and no coordinates provided
    const addressChanged = 
      updateData.addressLine1 !== undefined || 
      updateData.city !== undefined || 
      updateData.postcode !== undefined;
    
    if (addressChanged && !updateData.lat && !updateData.lng) {
      const mergedClient = { ...client, ...updateData };
      const fullAddress = buildFullAddress(mergedClient);
      
      if (fullAddress) {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          updateData.lat = coords.lat;
          updateData.lng = coords.lng;
          console.log(`✓ Auto-geocoded updated address: ${fullAddress} -> ${coords.lat}, ${coords.lng}`);
        } else {
          console.log(`⚠ Could not geocode updated address: ${fullAddress}`);
        }
      }
    }

    const updated = await repo.updateClient(clientId, updateData);
    return updated;
  });

  // Mark client profile as complete - Allows clients to complete their onboarding
  fastify.post('/clients/:clientId/complete-profile', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Only allow clients to complete their own profile
    if (auth.user.role !== 'client' || auth.crmClientId !== clientId) {
      return reply.code(403).send({ error: 'forbidden: can only complete your own profile' });
    }

    const updated = await repo.updateClient(clientId, { profileComplete: true });
    return updated;
  });

  // Get all dogs for a business - Admin/staff only
  fastify.get('/dogs', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { businessId } = req.query;
    
    if (!businessId) {
      return reply.code(400).send({ error: 'businessId is required' });
    }
    
    // Only allow admin/staff from the same business
    if (auth.user.role === 'client' || auth.businessId !== businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other business data' });
    }
    
    const dogs = await repo.listDogsByBusiness(businessId);
    return { dogs };
  });

  // Get dogs for a client - Allows both business users AND clients to access their own dogs
  fastify.get('/dogs/by-client/:clientId', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Allow access if:
    // 1. User is a client accessing their own dogs (primary check - don't need businessId match)
    // 2. User is admin/staff in the same business
    const isOwnData = auth.user.role === 'client' && auth.crmClientId === clientId;
    const isAdminOrStaff = auth.user.role !== 'client' && auth.businessId && client.businessId && auth.businessId === client.businessId;
    
    if (!isOwnData && !isAdminOrStaff) {
      return reply.code(403).send({ error: 'forbidden: cannot access other clients' });
    }

    const dogs = await repo.listDogsByClient(clientId);
    return dogs;
  });

  // Create a new dog - Allows both business users AND clients to add their own dogs
  fastify.post('/dogs/create', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;

    const { clientId } = req.body;
    
    if (!clientId) {
      return reply.code(400).send({ error: 'clientId is required' });
    }
    
    // Verify the client exists
    const client = await repo.getClient(clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }
    
    // Allow access if:
    // 1. User is a client adding their own dog (primary check - don't need businessId match)
    // 2. User is admin/staff in the same business
    const isOwnData = auth.user.role === 'client' && auth.crmClientId === clientId;
    const isAdminOrStaff = auth.user.role !== 'client' && auth.businessId && client.businessId && auth.businessId === client.businessId;
    
    if (!isOwnData && !isAdminOrStaff) {
      return reply.code(403).send({ error: 'forbidden: cannot create dogs for other clients' });
    }

    // Use businessId from auth (guaranteed to be set by getAuthenticatedUser)
    const dogData = {
      ...req.body,
      businessId: auth.businessId
    };

    const newDog = await repo.createDog(dogData);
    return { dog: newDog };
  });

  // Client booking request endpoint - Creates bookings with PENDING status
  fastify.post('/client/bookings/request', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;

    const { clientId, serviceId, dogIds, dateTime, notes } = req.body;
    
    // Use businessId from authenticated context (not from request body) to prevent spoofing
    const businessId = auth.businessId;

    // Verify this is the client's own booking request
    if (auth.user.role === 'client' && auth.crmClientId !== clientId) {
      return reply.code(403).send({ error: 'forbidden: can only request bookings for yourself' });
    }

    // Verify client exists and belongs to the authenticated business
    const client = await repo.getClient(clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    if (client.businessId !== businessId) {
      return reply.code(403).send({ error: 'forbidden: client does not belong to this business' });
    }

    // Verify service exists and belongs to the authenticated business
    const service = await repo.getService(serviceId);
    if (!service || service.businessId !== businessId) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    // Verify all dogs belong to the client
    for (const dogId of dogIds) {
      const dog = await repo.getDog(dogId);
      if (!dog || dog.clientId !== clientId) {
        return reply.code(403).send({ error: `Dog ${dogId} not found or does not belong to client` });
      }
    }

    // Create booking with PENDING status (requires admin approval)
    const booking = await repo.createJob({
      businessId,
      clientId,
      serviceId,
      dogIds,
      start: dateTime,
      dateTime,
      status: 'PENDING',
      notes: notes || '',
      durationMinutes: service.durationMinutes || 30,
      priceCents: service.priceCents || 0
    });

    // Emit real-time events so admin calendar updates immediately
    emitBookingCreated(booking);
    emitStatsChanged();

    return { success: true, booking };
  });

  // Get all bookings for the authenticated client
  fastify.get('/bookings/mine', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;

    // Only clients can use this endpoint
    if (auth.user.role?.toUpperCase() !== 'CLIENT') {
      return reply.code(403).send({ error: 'forbidden: this endpoint is for clients only' });
    }

    const clientId = auth.crmClientId;
    if (!clientId) {
      return reply.code(403).send({ error: 'forbidden: client record not linked' });
    }

    // Get all jobs for this client
    const jobs = await repo.listJobsByClient(clientId);
    
    // Enrich with service, staff, and dog details
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      const service = job.serviceId ? await repo.getService(job.serviceId) : null;
      const staffMember = job.staffId ? await repo.getUser(job.staffId) : null;
      const dogs = job.dogIds ? await Promise.all(
        job.dogIds.map(id => repo.getDog(id))
      ) : [];

      return {
        ...job,
        serviceName: service?.name || 'Unknown Service',
        staffName: staffMember?.name || 'Not assigned',
        dogs: dogs.filter(Boolean).map(d => ({
          dogId: d.id,
          name: d.name
        }))
      };
    }));

    return enrichedJobs;
  });

  // Invite a new client (admin/staff only)
  fastify.post('/clients/invite', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { email, name } = req.body;

    if (!email) {
      return reply.code(400).send({ error: 'Email is required' });
    }

    // Generate a unique invite token and ID
    const { nanoid } = await import('nanoid');
    const inviteToken = `inv_${nanoid(32)}`;
    const inviteId = `cinv_${Date.now()}_${nanoid(8)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7-day expiry

    // Store the invite token
    await repo.createClientInvite({
      id: inviteId,
      token: inviteToken,
      businessId: auth.businessId,
      email: email.toLowerCase().trim(),
      name: name?.trim() || '',
      expiresAt,
      createdBy: auth.user.id
    });

    // Generate the invite URL
    const baseUrl = process.env.VITE_APP_URL || 'http://localhost:5000';
    const inviteUrl = `${baseUrl}/client-signup?token=${inviteToken}`;

    return {
      success: true,
      inviteToken,
      inviteUrl,
      expiresAt
    };
  });

  // Deactivate a client (admin/staff only)
  fastify.post('/clients/:clientId/deactivate', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Verify client belongs to the same business
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot deactivate clients from other businesses' });
    }

    // Check if already deactivated
    if (client.isActive === false) {
      return reply.code(400).send({ error: 'Client is already deactivated' });
    }

    // Deactivate client with 30-day reactivation window
    const now = new Date();
    const reactivationExpiry = new Date(now);
    reactivationExpiry.setDate(reactivationExpiry.getDate() + 30);

    const updated = await repo.updateClient(clientId, {
      isActive: false,
      deactivatedAt: now,
      reactivationExpiresAt: reactivationExpiry
    });

    return { 
      success: true,
      message: 'Client deactivated successfully',
      reactivationExpiresAt: reactivationExpiry
    };
  });

  // Reactivate a client (admin/staff only)
  fastify.post('/clients/:clientId/reactivate', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;
    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Verify client belongs to the same business
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot reactivate clients from other businesses' });
    }

    // Check if already active
    if (client.isActive !== false) {
      return reply.code(400).send({ error: 'Client is already active' });
    }

    // Check if within 30-day reactivation window
    const now = new Date();
    if (client.reactivationExpiresAt && new Date(client.reactivationExpiresAt) < now) {
      return reply.code(403).send({ 
        error: 'Reactivation window has expired (30 days). Please create a new client profile.',
        expiredAt: client.reactivationExpiresAt
      });
    }

    // Reactivate client
    const updated = await repo.updateClient(clientId, {
      isActive: true,
      deactivatedAt: null,
      reactivationExpiresAt: null
    });

    return { 
      success: true,
      message: 'Client reactivated successfully'
    };
  });

  // Get current client's own profile
  fastify.get('/me', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    // Only clients can use this endpoint
    if (auth.user.role !== 'client') {
      return reply.code(403).send({ error: 'forbidden: this endpoint is for clients only' });
    }
    
    const clientId = auth.crmClientId;
    if (!clientId) {
      return reply.code(403).send({ error: 'forbidden: client record not linked' });
    }
    
    const client = await repo.getClient(clientId);
    
    if (!client) {
      return reply.code(404).send({ error: 'Client profile not found' });
    }
    
    // Verify business scoping - prevent cross-tenant access
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: business context mismatch' });
    }
    
    return client;
  });

  // Update current client's own profile
  fastify.post('/me/update', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    // Only clients can use this endpoint
    if (auth.user.role !== 'client') {
      return reply.code(403).send({ error: 'forbidden: this endpoint is for clients only' });
    }
    
    const clientId = auth.crmClientId;
    if (!clientId) {
      return reply.code(403).send({ error: 'forbidden: client record not linked' });
    }
    
    const client = await repo.getClient(clientId);
    
    if (!client) {
      return reply.code(404).send({ error: 'Client profile not found' });
    }
    
    // Verify business scoping - prevent cross-tenant access
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: business context mismatch' });
    }
    
    const updateData = { ...req.body };

    // Auto-geocode if address fields changed and no coordinates provided
    const addressChanged = 
      updateData.addressLine1 !== undefined || 
      updateData.city !== undefined || 
      updateData.postcode !== undefined;
    
    if (addressChanged && !updateData.lat && !updateData.lng) {
      const mergedClient = { ...client, ...updateData };
      const fullAddress = buildFullAddress(mergedClient);
      
      if (fullAddress) {
        const coords = await geocodeAddress(fullAddress);
        if (coords) {
          updateData.lat = coords.lat;
          updateData.lng = coords.lng;
          console.log(`✓ Auto-geocoded client profile address: ${fullAddress} -> ${coords.lat}, ${coords.lng}`);
        } else {
          console.log(`⚠ Could not geocode client profile address: ${fullAddress}`);
        }
      }
    }

    const updated = await repo.updateClient(clientId, updateData);
    return updated;
  });

  // Get current client's own dogs
  fastify.get('/dogs/list', async (req, reply) => {
    const auth = await getAuthenticatedUser(fastify, req, reply);
    if (!auth) return;
    
    // Only clients can use this endpoint
    if (auth.user.role !== 'client') {
      return reply.code(403).send({ error: 'forbidden: this endpoint is for clients only' });
    }
    
    const clientId = auth.crmClientId;
    if (!clientId) {
      return reply.code(403).send({ error: 'forbidden: client record not linked' });
    }
    
    // Verify the client belongs to the authenticated business
    const client = await repo.getClient(clientId);
    if (!client || client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: business context mismatch' });
    }
    
    const dogs = await repo.listDogsByClient(clientId);
    return Array.isArray(dogs) ? dogs : [];
  });
  
  // Dismiss welcome modal for client
  fastify.post('/client/welcome/dismiss', async (req, reply) => {
    try {
      const auth = await getAuthenticatedClient(fastify, req, reply);
      if (!auth) return;
      
      await repo.updateClient(auth.crmClientId, { hasSeenWelcomeModal: true });
      
      return { success: true };
    } catch (error) {
      console.error('Failed to dismiss welcome modal:', error);
      return reply.code(500).send({ error: 'Failed to dismiss welcome modal' });
    }
  });
}
