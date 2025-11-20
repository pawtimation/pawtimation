import { repo } from '../repo.js';
import { users } from '../authRoutes.js';

function getAuthenticatedBusinessUser(app, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = app.jwt.verify(token);
    const user = [...users.values()].find(u => u.id === payload.sub);
    if (!user || user.role === 'client') {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    return { user, businessId: user.businessId };
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

export default async function businessServicesRoutes(app) {
  // List services for authenticated business user
  app.get('/services/list', async (req, reply) => {
    const auth = getAuthenticatedBusinessUser(app, req, reply);
    if (!auth) return;

    const services = await repo.listServicesByBusiness(auth.businessId);
    return services;
  });

  // GET all services
  app.get('/business/:businessId/services', async (req, reply) => {
    const settings = await repo.getBusinessSettings(req.params.businessId);
    return settings.services || [];
  });

  // ADD service
  app.post('/business/:businessId/services', async (req, reply) => {
    const { businessId } = req.params;
    const { service } = req.body;

    if (!service || !service.name) {
      return reply.code(400).send({ error: 'Service must include a name' });
    }

    const settings = await repo.getBusinessSettings(businessId);
    const newService = {
      id: 'srv_' + Math.random().toString(36).slice(2),
      name: service.name,
      durationMins: service.durationMins || 30,
      price: service.price || 0,
      visibleToClients: service.visibleToClients ?? true,
      allowExtraDog: service.allowExtraDog ?? false,
      extraDogFee: service.extraDogFee ?? 0,
      weekendFee: service.weekendFee ?? 0,
      staffRule: service.staffRule || 'any',
      assignTo: service.assignTo || null
    };

    await repo.updateBusinessSettings(businessId, {
      services: [...(settings.services || []), newService]
    });

    return newService;
  });

  // UPDATE service
  app.put('/business/:businessId/services/:serviceId', async (req, reply) => {
    const { businessId, serviceId } = req.params;
    const patch = req.body.service;

    const settings = await repo.getBusinessSettings(businessId);
    const services = settings.services || [];

    const updatedServices = services.map(s =>
      s.id === serviceId ? { ...s, ...patch } : s
    );

    await repo.updateBusinessSettings(businessId, {
      services: updatedServices
    });

    return updatedServices.find(s => s.id === serviceId);
  });

  // DELETE service
  app.delete('/business/:businessId/services/:serviceId', async (req, reply) => {
    const { businessId, serviceId } = req.params;

    const settings = await repo.getBusinessSettings(businessId);
    const services = settings.services || [];

    const updatedServices = services.filter(s => s.id !== serviceId);

    await repo.updateBusinessSettings(businessId, {
      services: updatedServices
    });

    return { ok: true };
  });
}
