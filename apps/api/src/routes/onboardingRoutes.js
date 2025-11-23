import { repo } from '../repo.js';
import { storage } from '../storage.js';

async function getAuthenticatedBusinessUser(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    const user = await repo.getUser(payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
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

export default async function onboardingRoutes(fastify) {
  fastify.get('/admin/onboarding/progress', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const business = await repo.getBusiness(auth.businessId);
    
    const defaultSteps = {
      servicesAdded: false,
      staffAdded: false,
      clientsAdded: false,
      bookingCreated: false,
      bookingCompleted: false,
      invoiceGenerated: false,
      paymentReceived: false,
      wizardDismissed: false
    };

    const progress = { ...defaultSteps, ...(business.onboardingSteps || {}) };

    const services = await repo.listServicesByBusiness(auth.businessId);
    const staff = await repo.listStaffByBusiness(auth.businessId);
    const clients = await repo.listClientsByBusiness(auth.businessId);
    const jobs = await repo.listJobsByBusiness(auth.businessId);
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED');
    const invoices = await repo.listInvoicesByBusiness(auth.businessId);
    const paidInvoices = invoices.filter(i => i.paidAt);

    const detectedProgress = {
      servicesAdded: services.length > 0,
      staffAdded: staff.length > 0,
      clientsAdded: clients.length > 0,
      bookingCreated: jobs.length > 0,
      bookingCompleted: completedJobs.length > 0,
      invoiceGenerated: invoices.length > 0,
      paymentReceived: paidInvoices.length > 0,
      wizardDismissed: progress.wizardDismissed || false
    };

    await storage.updateBusiness(auth.businessId, {
      onboardingSteps: detectedProgress
    });

    return {
      progress: detectedProgress,
      counts: {
        services: services.length,
        staff: staff.length,
        clients: clients.length,
        bookings: jobs.length,
        completedBookings: completedJobs.length,
        invoices: invoices.length,
        payments: paidInvoices.length
      }
    };
  });

  fastify.post('/admin/onboarding/dismiss', async (req, reply) => {
    const auth = await getAuthenticatedBusinessUser(fastify, req, reply);
    if (!auth) return;

    const business = await repo.getBusiness(auth.businessId);
    const currentSteps = business.onboardingSteps || {};

    await storage.updateBusiness(auth.businessId, {
      onboardingSteps: {
        ...currentSteps,
        wizardDismissed: true
      }
    });

    return { success: true };
  });
}
