import { getAuthenticatedBusinessUser } from '../authHelpers.js';

export async function clientRoutes(fastify) {
  // List all clients for a business
  fastify.get('/clients/list', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
    const clients = await repo.listClientsByBusiness(auth.businessId);
    return clients;
  });

  // Get a single client
  fastify.get('/clients/:clientId', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
    const { clientId } = req.params;
    const client = await repo.getClient(clientId);

    if (!client) {
      return reply.code(404).send({ error: 'Client not found' });
    }

    // Verify client belongs to the business
    if (client.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' clients' });
    }

    return client;
  });

  // Update a client
  fastify.post('/clients/:clientId/update', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
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
    const auth = getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const { repo } = fastify;
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
}
