import { repo } from '../repo.js';
import { geocodeAddress, buildFullAddress } from '../services/geocodingService.js';

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
      
      // Get client record to resolve businessId
      const clientRecord = await repo.getClient(user.crmClientId);
      if (!clientRecord) {
        reply.code(404).send({ error: 'client record not found' });
        return null;
      }
      
      // Try to resolve businessId from user record or client record
      if (!resolvedBizId) {
        resolvedBizId = clientRecord.businessId || null;
      }
      
      // If we still don't have a businessId, try to repair the data
      if (!resolvedBizId) {
        // Get the first business as a fallback (most installations have one business)
        const businesses = await repo.listBusinesses();
        if (businesses.length > 0) {
          resolvedBizId = businesses[0].id;
          
          // Repair the client record with the businessId
          await repo.updateClient(user.crmClientId, { businessId: resolvedBizId });
          
          // Also update user's businessId for future logins
          user.businessId = resolvedBizId;
          
          console.log(`✓ Repaired client ${user.crmClientId} and user ${user.id} with businessId ${resolvedBizId}`);
        }
      }
      
      // For clients, allow proceeding even without businessId (though we try to repair)
      return {
        user,
        crmClientId: user.crmClientId,
        businessId: resolvedBizId,
        hasBusinessContext: Boolean(resolvedBizId)
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
    return clients;
  });

  // Create a new client
  fastify.post('/clients/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

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

    // Use businessId from auth, fallback to client record if missing
    const effectiveBusinessId = auth.businessId || client.businessId;
    
    if (!effectiveBusinessId) {
      return reply.code(409).send({ error: 'conflict: cannot create dog without business association' });
    }

    const dogData = {
      ...req.body,
      businessId: effectiveBusinessId
    };

    const newDog = await repo.createDog(dogData);
    return { dog: newDog };
  });
}
