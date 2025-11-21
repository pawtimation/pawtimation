import { repo } from '../repo.js';

async function getAuthenticatedBusinessUser(app, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = app.jwt.verify(token);
    const user = await repo.getUser(payload.sub);
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

// Helper function to validate and parse numeric input
function validateNumeric(value, fieldName) {
  // Reject null, boolean, arrays, objects
  if (value === null || typeof value === 'boolean' || Array.isArray(value) || (typeof value === 'object' && value !== null)) {
    return { error: `${fieldName} must be a number` };
  }
  
  // Reject empty strings
  if (value === '' || (typeof value === 'string' && !value.trim())) {
    return { error: `${fieldName} cannot be empty` };
  }
  
  // Parse to number
  const parsed = Number(value);
  
  // Reject NaN
  if (isNaN(parsed)) {
    return { error: `${fieldName} must be a valid number` };
  }
  
  // Reject negative numbers
  if (parsed < 0) {
    return { error: `${fieldName} must be a positive number` };
  }
  
  return { value: parsed };
}

// Helper function to validate and parse boolean input
function validateBoolean(value) {
  return value === true || value === 'true';
}

export default async function businessServicesRoutes(app) {
  // List services for authenticated business user
  app.get('/services/list', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(app, req, reply);
    if (!auth) return;

    const services = await repo.listServicesByBusiness(auth.businessId);
    return services;
  });

  // Create a new service
  app.post('/services/create', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(app, req, reply);
    if (!auth) return;

    // Extract and validate all service fields
    const { name, description, durationMinutes, priceCents, group, maxDogs, allowClientBooking, approvalRequired, active } = req.body;

    if (!name || !name.trim()) {
      return reply.code(400).send({ error: 'Service name is required' });
    }

    // Validate and coerce duration
    let validDuration = 30;
    if (durationMinutes !== undefined) {
      const result = validateNumeric(durationMinutes, 'Duration');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      validDuration = result.value;
    }

    // Validate and coerce price
    let validPrice = 0;
    if (priceCents !== undefined) {
      const result = validateNumeric(priceCents, 'Price');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      validPrice = result.value;
    }

    // Validate maxDogs if provided
    let validMaxDogs = 1;
    if (maxDogs !== undefined) {
      const result = validateNumeric(maxDogs, 'Maximum dogs');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      validMaxDogs = result.value;
    }

    const serviceData = {
      businessId: auth.businessId,
      name: name.trim(),
      description: description || '',
      durationMinutes: validDuration,
      priceCents: validPrice,
      group: validateBoolean(group),
      maxDogs: validMaxDogs,
      allowClientBooking: allowClientBooking !== undefined ? validateBoolean(allowClientBooking) : true,
      approvalRequired: validateBoolean(approvalRequired),
      active: active !== undefined ? validateBoolean(active) : true
    };

    const newService = await repo.createService(serviceData);
    return { service: newService };
  });

  // Update a service
  app.post('/services/:serviceId/update', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(app, req, reply);
    if (!auth) return;

    const { serviceId } = req.params;
    const service = await repo.getService(serviceId);

    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    // Verify service belongs to the business
    if (service.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' services' });
    }

    // Extract and validate all fields allowed for update
    const { name, description, durationMinutes, priceCents, group, maxDogs, allowClientBooking, approvalRequired, active } = req.body;
    
    const updateData = {};
    if (name !== undefined) {
      if (!name.trim()) {
        return reply.code(400).send({ error: 'Service name cannot be empty' });
      }
      updateData.name = name.trim();
    }
    
    if (description !== undefined) updateData.description = description || '';
    
    if (durationMinutes !== undefined) {
      const result = validateNumeric(durationMinutes, 'Duration');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      updateData.durationMinutes = result.value;
    }
    
    if (priceCents !== undefined) {
      const result = validateNumeric(priceCents, 'Price');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      updateData.priceCents = result.value;
    }
    
    if (group !== undefined) updateData.group = validateBoolean(group);
    
    if (maxDogs !== undefined) {
      const result = validateNumeric(maxDogs, 'Maximum dogs');
      if (result.error) {
        return reply.code(400).send({ error: result.error });
      }
      updateData.maxDogs = result.value;
    }
    
    if (allowClientBooking !== undefined) updateData.allowClientBooking = validateBoolean(allowClientBooking);
    if (approvalRequired !== undefined) updateData.approvalRequired = validateBoolean(approvalRequired);
    if (active !== undefined) updateData.active = validateBoolean(active);

    const updated = await repo.updateService(serviceId, updateData);
    return { service: updated };
  });

  // Delete a service
  app.post('/services/:serviceId/delete', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(app, req, reply);
    if (!auth) return;

    const { serviceId } = req.params;
    const service = await repo.getService(serviceId);

    if (!service) {
      return reply.code(404).send({ error: 'Service not found' });
    }

    // Verify service belongs to the business
    if (service.businessId !== auth.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot delete other businesses\' services' });
    }

    // Mark as inactive instead of deleting (soft delete)
    const updated = await repo.updateService(serviceId, { active: false });
    return { success: true, service: updated };
  });

  // GET all services
  app.get('/business/:businessId/services', async (req, reply) => {
    const services = await repo.listServicesByBusiness(req.params.businessId);
    return services || [];
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
