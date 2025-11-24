import { repo } from '../repo.js';

/**
 * Authentication and Authorization Helpers
 * 
 * These helpers provide role-based access control with consistent error handling
 * and clear separation of concerns. All role comparisons are case-insensitive.
 */

/**
 * Base authentication helper - verifies JWT and returns user
 * @private
 */
async function authenticate(fastify, req, reply) {
  try {
    const token = req.cookies?.token || (req.headers.authorization || '').replace('Bearer ', '');
    const payload = fastify.jwt.verify(token);
    
    const user = await repo.getUser(payload.sub);
    if (!user) {
      reply.code(401).send({ error: 'unauthenticated' });
      return null;
    }
    
    return user;
  } catch (err) {
    reply.code(401).send({ error: 'unauthenticated' });
    return null;
  }
}

/**
 * Normalize role for case-insensitive comparison
 * @private
 */
function normalizeRole(role) {
  return (role || '').toUpperCase();
}

/**
 * Require authenticated admin user
 * Blocks: staff, client
 * @returns {Promise<{user, businessId}|null>}
 */
export async function requireAdminUser(fastify, req, reply) {
  const user = await authenticate(fastify, req, reply);
  if (!user) return null;
  
  const role = normalizeRole(user.role);
  
  if (role === 'CLIENT') {
    reply.code(403).send({ error: 'forbidden: admin access required' });
    return null;
  }
  
  if (role === 'STAFF') {
    reply.code(403).send({ error: 'forbidden: admin access required' });
    return null;
  }
  
  return { user, businessId: user.businessId };
}

/**
 * Require authenticated staff user
 * Blocks: admin, client
 * Note: This is intentionally restrictive. Use requireStaffOrAdminUser for endpoints
 * that allow both staff and admin access.
 * @returns {Promise<{user, businessId}|null>}
 */
export async function requireStaffUser(fastify, req, reply) {
  const user = await authenticate(fastify, req, reply);
  if (!user) return null;
  
  const role = normalizeRole(user.role);
  
  if (role !== 'STAFF') {
    reply.code(403).send({ error: 'forbidden: staff access required' });
    return null;
  }
  
  return { user, businessId: user.businessId };
}

/**
 * Require authenticated client user
 * Blocks: admin, staff
 * @param {boolean} silent - If true, don't send error response (for dual-auth scenarios)
 * @returns {Promise<{user, clientId}|null>}
 */
export async function requireClientUser(fastify, req, reply, silent = false) {
  const user = await authenticate(fastify, req, reply);
  if (!user) return null;
  
  const role = normalizeRole(user.role);
  
  if (role !== 'CLIENT' || !user.crmClientId) {
    if (!silent) {
      reply.code(403).send({ error: 'forbidden: client access required' });
    }
    return null;
  }
  
  return { user, clientId: user.crmClientId, businessId: user.businessId };
}

/**
 * Require authenticated business user (admin OR staff)
 * Blocks: client only
 * @param {boolean} silent - If true, don't send error response (for dual-auth scenarios)
 * @returns {Promise<{user, businessId, isStaff: boolean, isAdmin: boolean}|null>}
 */
export async function requireBusinessUser(fastify, req, reply, silent = false) {
  const user = await authenticate(fastify, req, reply);
  if (!user) return null;
  
  const role = normalizeRole(user.role);
  
  if (role === 'CLIENT') {
    if (!silent) {
      reply.code(403).send({ error: 'forbidden: business access required' });
    }
    return null;
  }
  
  return {
    user,
    businessId: user.businessId,
    isStaff: role === 'STAFF',
    isAdmin: role === 'ADMIN' || role === 'BUSINESS'
  };
}

/**
 * Require authenticated staff user with assignment to a specific job
 * Also allows admin users (admin can access all jobs)
 * @param {string} jobId - The job ID to verify assignment
 * @returns {Promise<{user, businessId, job, isStaff: boolean}|null>}
 */
export async function requireStaffUserWithAssignment(fastify, req, reply, jobId) {
  const auth = await requireBusinessUser(fastify, req, reply);
  if (!auth) return null;
  
  // Get the job
  const job = await repo.getJob(jobId);
  if (!job) {
    reply.code(404).send({ error: 'Booking not found' });
    return null;
  }
  
  // Verify business ownership
  if (job.businessId !== auth.businessId) {
    reply.code(403).send({ error: 'forbidden: cannot access bookings from other businesses' });
    return null;
  }
  
  // Staff must be assigned to the job
  if (auth.isStaff && job.staffId !== auth.user.id) {
    reply.code(403).send({ error: 'forbidden: can only access bookings assigned to you' });
    return null;
  }
  
  return {
    user: auth.user,
    businessId: auth.businessId,
    job,
    isStaff: auth.isStaff
  };
}

/**
 * Verify staff user owns a specific job (for mutation operations)
 * This is stricter than requireStaffUserWithAssignment - it only allows the assigned staff,
 * not admins.
 * @param {string} jobId - The job ID to verify assignment
 * @returns {Promise<{user, businessId, job}|null>}
 */
export async function requireStaffJobOwnership(fastify, req, reply, jobId) {
  const auth = await requireStaffUser(fastify, req, reply);
  if (!auth) return null;
  
  const job = await repo.getJob(jobId);
  if (!job) {
    reply.code(404).send({ error: 'Booking not found' });
    return null;
  }
  
  if (job.businessId !== auth.businessId) {
    reply.code(403).send({ error: 'forbidden: cannot access bookings from other businesses' });
    return null;
  }
  
  if (job.staffId !== auth.user.id) {
    reply.code(403).send({ error: 'forbidden: can only access bookings assigned to you' });
    return null;
  }
  
  return {
    user: auth.user,
    businessId: auth.businessId,
    job
  };
}
