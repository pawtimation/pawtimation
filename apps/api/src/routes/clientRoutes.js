import { repo } from '../repo.js';

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

    const newClient = await repo.createClient(clientData);
    return { client: newClient };
  });

  // Get a single client
  fastify.get('/clients/:clientId', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      
      const user = await repo.getUser(payload.sub);
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      const { clientId } = req.params;
      const client = await repo.getClient(clientId);

      if (!client) {
        return reply.code(404).send({ error: 'Client not found' });
      }

      // Allow access if:
      // 1. User is admin/staff in the same business
      // 2. User is a client accessing their own data
      const isAdminOrStaff = user.role !== 'client' && user.businessId === client.businessId;
      const isOwnProfile = user.role === 'client' && user.crmClientId === clientId;
      
      if (!isAdminOrStaff && !isOwnProfile) {
        return reply.code(403).send({ error: 'forbidden: cannot access this client' });
      }

      return client;
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  });

  // Update a client
  fastify.post('/clients/:clientId/update', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Verify client belongs to the business
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' clients' });
    }

    const updated = await repo.updateClient(clientId, req.body);
    return updated;
  });

  // Get dogs for a client
  fastify.get('/dogs/by-client/:clientId', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Verify client belongs to the business
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' clients' });
    }

    const dogs = await repo.listDogsByClient(clientId);
    return dogs;
  });

  // Create a new dog
  fastify.post('/dogs/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { clientId } = req.body;
    
    // Verify the client exists and belongs to the business
    const client = await repo.getClient(clientId);
    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot create dogs for other businesses\' clients' });
    }

    const dogData = {
      ...req.body,
      businessId: auth.businessId
    };

    const newDog = await repo.createDog(dogData);
    return { dog: newDog };
  });
}
