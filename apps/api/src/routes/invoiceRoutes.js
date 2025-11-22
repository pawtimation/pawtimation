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
    
    // Fetch all clients at once to avoid N+1 query
    const clientIds = [...new Set(invoices.map(inv => inv.clientId).filter(Boolean))];
    const clients = await Promise.all(
      clientIds.map(id => repo.getClient(id))
    );
    const clientMap = new Map(clients.filter(Boolean).map(c => [c.id, c]));
    
    // Enrich with client details
    const enriched = invoices.map((inv) => {
      const client = inv.clientId ? clientMap.get(inv.clientId) : null;
      return {
        invoiceId: inv.id,
        clientName: client?.name || 'Unknown Client',
        clientEmail: client?.email || '',
        clientPhone: client?.phone || '',
        total: inv.amountCents,
        status: inv.status?.toLowerCase() || 'draft',
        dueDate: inv.createdAt,
        createdAt: inv.createdAt,
        sentToClient: inv.sentToClient,
        paidAt: inv.paidAt,
        paymentMethod: inv.paymentMethod
      };
    });

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

  // Mark invoice as paid (legacy endpoint - use /mark-paid instead)
  fastify.post('/invoices/:invoiceId/pay', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { invoiceId } = req.params;
    const { paymentMethod } = req.body ?? {};
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' invoices' });
    }

    // Prevent double-marking
    if (invoice.status?.toUpperCase() === 'PAID' || invoice.paidAt) {
      return reply.code(400).send({ error: 'Invoice has already been marked as paid' });
    }

    // Require payment method
    if (!paymentMethod) {
      return reply.code(400).send({ error: 'paymentMethod is required' });
    }

    // Validate payment method
    const validMethods = ['cash', 'card', 'bank_transfer', 'check', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return reply.code(400).send({ error: 'Invalid payment method. Must be one of: cash, card, bank_transfer, check, other' });
    }

    const updated = await repo.markInvoicePaid(invoiceId, paymentMethod);
    return { success: true, invoice: updated };
  });

  // Mark invoice as sent to client
  fastify.post('/invoices/:invoiceId/mark-sent', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { invoiceId } = req.params;
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' invoices' });
    }

    // Prevent double-marking
    if (invoice.sentToClient) {
      return reply.code(400).send({ error: 'Invoice has already been marked as sent' });
    }

    const updated = await repo.markInvoiceSent(invoiceId);
    return { success: true, invoice: updated };
  });

  // Mark invoice as paid with payment method
  fastify.post('/invoices/:invoiceId/mark-paid', { preHandler: requireBusinessUser }, async (req, reply) => {
    const { invoiceId } = req.params;
    const { paymentMethod } = req.body ?? {};
    
    const invoice = await repo.getInvoice(invoiceId);

    if (!invoice) {
      return reply.code(404).send({ error: 'Invoice not found' });
    }

    if (invoice.businessId !== req.businessId) {
      return reply.code(403).send({ error: 'forbidden: cannot update other businesses\' invoices' });
    }

    // Prevent double-marking
    if (invoice.status?.toUpperCase() === 'PAID' || invoice.paidAt) {
      return reply.code(400).send({ error: 'Invoice has already been marked as paid' });
    }

    // Require payment method
    if (!paymentMethod) {
      return reply.code(400).send({ error: 'paymentMethod is required' });
    }

    // Validate payment method
    const validMethods = ['cash', 'card', 'bank_transfer', 'check', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return reply.code(400).send({ error: 'Invalid payment method. Must be one of: cash, card, bank_transfer, check, other' });
    }

    const updated = await repo.markInvoicePaid(invoiceId, paymentMethod);
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

  // List pending invoice items
  fastify.get('/invoice-items/pending', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const items = await repo.listInvoiceItemsByBusiness(req.businessId, 'PENDING');
    
    // Group by client
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.clientId]) {
        const client = await repo.getClient(item.clientId);
        grouped[item.clientId] = {
          clientId: item.clientId,
          clientName: client?.name || 'Unknown Client',
          items: []
        };
      }
      grouped[item.clientId].items.push(item);
    }
    
    return Object.values(grouped);
  });

  // Generate invoice from selected pending items
  fastify.post('/invoices/generate', { preHandler: requireBusinessUser }, async (req, reply) => {
    
    const { clientId, itemIds } = req.body;
    
    if (!clientId || !itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return reply.code(400).send({ error: 'clientId and itemIds (array) are required' });
    }
    
    // Verify all items belong to this business and client
    const items = await Promise.all(itemIds.map(id => repo.getInvoiceItem(id)));
    
    for (const item of items) {
      if (!item) {
        return reply.code(404).send({ error: 'One or more items not found' });
      }
      if (item.businessId !== req.businessId) {
        return reply.code(403).send({ error: 'forbidden: items do not belong to your business' });
      }
      if (item.clientId !== clientId) {
        return reply.code(400).send({ error: 'All items must belong to the same client' });
      }
      if (item.status !== 'PENDING') {
        return reply.code(400).send({ error: 'Can only invoice PENDING items' });
      }
    }
    
    try {
      const invoice = await repo.generateInvoiceFromItems(req.businessId, clientId, itemIds);
      return { success: true, invoice };
    } catch (error) {
      return reply.code(500).send({ error: error.message || 'Failed to generate invoice' });
    }
  });

  // Client-facing endpoint to list their sent invoices
  fastify.get('/invoices/client/:clientId', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      const user = await repo.getUser(payload.sub);
      
      if (!user) {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      const { clientId } = req.params;
      
      // SECURITY: Only clients can access this endpoint
      if (user.role !== 'client') {
        return reply.code(403).send({ error: 'forbidden: client access required' });
      }
      
      // SECURITY: Verify the client is accessing their own invoices
      if (user.crmClientId !== clientId) {
        return reply.code(403).send({ error: 'forbidden: cannot access other clients\' invoices' });
      }
      
      // Get all invoices for this client
      const allInvoices = await repo.listInvoicesByClient(clientId);
      
      // Filter to only show invoices that have been sent to client and belong to same business
      // sentToClient is a timestamp - if it exists (not null), the invoice has been sent
      const sentInvoices = allInvoices.filter(inv => 
        inv.sentToClient != null && inv.businessId === user.businessId
      );
      
      // Enrich with details
      const enriched = await Promise.all(
        sentInvoices.map(async (inv) => {
          const items = inv.meta?.items || [];
          return {
            id: inv.id,
            invoiceNumber: inv.id.replace('inv_', '').toUpperCase(),
            amountCents: inv.amountCents,
            status: inv.status || 'UNPAID',
            createdAt: inv.createdAt,
            paidAt: inv.paidAt,
            items,
            sentToClient: inv.sentToClient
          };
        })
      );
      
      return { invoices: enriched };
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  });

  // Client-facing endpoint to preview/download invoice PDF
  fastify.get('/invoices/:invoiceId/client-pdf', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
      const payload = fastify.jwt.verify(token);
      const user = await repo.getUser(payload.sub);
      
      // SECURITY: Only clients can access this endpoint
      if (!user || user.role !== 'client') {
        return reply.code(401).send({ error: 'unauthenticated' });
      }
      
      const { invoiceId } = req.params;
      const { download } = req.query; // ?download=true for download, otherwise preview
      
      const invoice = await repo.getInvoice(invoiceId);
      
      if (!invoice) {
        return reply.code(404).send({ error: 'Invoice not found' });
      }
      
      // SECURITY: Verify the client owns this invoice
      if (invoice.clientId !== user.crmClientId) {
        return reply.code(403).send({ error: 'forbidden: cannot access other clients\' invoices' });
      }
      
      // SECURITY: Verify invoice has been sent and belongs to same business
      // sentToClient is a timestamp - if it's null, invoice hasn't been sent
      if (invoice.sentToClient == null) {
        return reply.code(403).send({ error: 'forbidden: invoice has not been sent yet' });
      }
      
      if (invoice.businessId !== user.businessId) {
        return reply.code(403).send({ error: 'forbidden: business mismatch' });
      }
      
      // Get enriched data
      const business = await repo.getBusiness(invoice.businessId);
      const client = await repo.getClient(invoice.clientId);
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
        email: business?.settings?.profile?.email || '',
        primaryColor: business?.settings?.branding?.primaryColor || '#0FAE7B'
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
        
        // Use inline for preview, attachment for download
        if (download === 'true') {
          reply.header('Content-Disposition', `attachment; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
        } else {
          reply.header('Content-Disposition', `inline; filename="invoice-${invoiceData.invoiceNumber}.pdf"`);
        }
        
        return reply.send(pdfBuffer);
      } catch (error) {
        fastify.log.error('PDF generation failed:', error);
        return reply.code(500).send({ error: 'Failed to generate PDF' });
      }
    } catch (err) {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
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
      email: business?.settings?.profile?.email || '',
      primaryColor: business?.settings?.branding?.primaryColor || '#0FAE7B'
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
