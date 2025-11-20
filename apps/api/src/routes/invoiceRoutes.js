import { repo } from '../repo.js';
import { generateInvoicePDF } from '../services/pdfGenerator.js';

export async function invoiceRoutes(fastify) {
  // Middleware to verify authenticated business/admin user
  async function requireBusinessUser(req, reply) {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      
      // Get the user from the unified storage
      const user = await repo.getUser(payload.sub);
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      // Verify this is an admin or business user (not a client)
      if (user.role === 'client') {
        return reply.code(403).send({ error: 'forbidden: admin access required' });
      }
      
      // Attach user info to request for use in route handlers
      req.user = user;
      req.businessId = user.businessId;
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  }

  // List all invoices for a business
  fastify.get('/invoices/list', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const invoices = await repo.listInvoicesByBusiness(req.businessId);
    
    // Enrich with client details
    const enriched = await Promise.all(
      invoices.map(async (inv) => {
        const client = inv.clientId ? await repo.getClient(inv.clientId) : null;
        return {
          invoiceId: inv.id,
          clientName: client?.name || 'Unknown Client',
          clientEmail: client?.email || '',
          clientPhone: client?.phone || '',
          total: inv.amountCents,
          status: inv.status?.toLowerCase() || 'draft',
          dueDate: inv.createdAt, // In a real system, calculate due date
          createdAt: inv.createdAt
        };
      })
    );

    return enriched;
  });

  // Get a single invoice
  fastify.get('/invoices/:invoiceId', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const { invoiceId } = req.params;
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to the business
    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' invoices' });
    }

    // Enrich with client details and job information
    const client = invoice.clientId ? await repo.getClient(invoice.clientId) : null;
    const job = invoice.jobId ? await repo.getJob(invoice.jobId) : null;
    
    // Build items array from job or invoice metadata
    const items = invoice.meta?.items || (job ? [{
      description: `Service on ${new Date(job.start).toLocaleDateString()}`,
      amount: invoice.amountCents
    }] : [{
      description: 'Service',
      amount: invoice.amountCents
    }]);

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.id.replace('inv_', ''),
      clientName: client?.name || 'Unknown Client',
      clientEmail: client?.email || '',
      clientPhone: client?.phone || '',
      total: invoice.amountCents,
      status: invoice.status?.toLowerCase() || 'draft',
      dueDate: invoice.createdAt,
      items,
      createdAt: invoice.createdAt,
      paidAt: invoice.paidAt
    };
  });

  // Mark invoice as paid
  fastify.post('/invoices/:invoiceId/pay', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const { invoiceId } = req.params;
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to the business
    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' invoices' });
    }

    const updated = await repo.markInvoicePaid(invoiceId);
    return { success: true, invoice: updated };
  });

  // Resend invoice
  fastify.post('/invoices/:invoiceId/resend', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const { invoiceId } = req.params;
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to the business
    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot resend other businesses\' invoices' });
    }

    const result = await repo.resendInvoice(invoiceId);
    return result;
  });

  // Generate PDF for invoice
  fastify.get('/invoices/:invoiceId/pdf', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const { invoiceId } = req.params;
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to the business
    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot access other businesses\' invoices' });
    }

    // Get enriched data
    const business = await repo.getBusiness(invoice.businessId);
    const client = invoice.clientId ? await repo.getClient(invoice.clientId) : null;
    const job = invoice.jobId ? await repo.getJob(invoice.jobId) : null;
    const service = job?.serviceId ? await repo.getService(job.serviceId) : null;

    // Build items array
    const items = invoice.meta?.items || (service ? [{
      description: service.name || 'Service',
      quantity: 1,
      amount: invoice.amountCents
    }] : [{
      description: `Service on ${new Date(job?.start || invoice.createdAt).toLocaleDateString()}`,
      quantity: 1,
      amount: invoice.amountCents
    }]);

    // Prepare data for PDF
    const invoiceData = {
      invoiceId: invoice.id,
      invoiceNumber: invoice.id.replace('inv_', '').toUpperCase(),
      total: invoice.amountCents,
      items,
      createdAt: invoice.createdAt,
      paymentUrl: invoice.paymentUrl
    };

    const businessData = {
      name: business?.name || 'Pawtimation',
      address: business?.settings?.profile?.address || '',
      phone: business?.settings?.profile?.phone || '',
      email: business?.settings?.profile?.email || ''
    };

    const clientData = {
      name: client?.name || 'Client',
      email: client?.email || '',
      phone: client?.phone || '',
      address: client?.address || ''
    };

    try {
      const pdfBuffer = await generateInvoicePDF(invoiceData, businessData, clientData);
      
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
      return reply.send(pdfBuffer);
    } catch (error) {
      fastify.log.error('PDF generation failed:', error);
      return reply.code(500).send({ error: 'Failed to generate PDF' });
    }
  });
}
