import bcrypt from 'bcryptjs';
import * as repo from './repo.js';
import { db } from './store.js';
import { trackFailedLogin, clearFailedLogins } from './utils/securityMonitoring.js';

// In-memory fallback user store for MVP (replace with DB later)
export const users = new Map(); // key: email, value: { id, email, name, passHash, sitterId, isAdmin }

export default async function authRoutes(app){

  async function publicUser(u){ 
    // Look up businessId from db.users if not in auth user record
    let businessId = u.businessId;
    if (!businessId) {
      const dbUsers = Object.values(db.users || {});
      const dbUser = dbUsers.find(user => user.id === u.id);
      if (dbUser) {
        businessId = dbUser.businessId;
      }
    }
    
    // Fetch business name to include in user session
    let businessName = null;
    if (businessId) {
      const business = await repo.getBusiness(businessId);
      if (business) {
        businessName = business.name;
      }
    }
    
    return { 
      id: u.id, 
      email: u.email, 
      name: u.name, 
      sitterId: u.sitterId, 
      businessId, 
      businessName,
      isAdmin: u.isAdmin || false,
      role: u.role || 'owner',
      crmClientId: u.crmClientId || null // For client users
    }; 
  }

  app.get('/health', async () => ({ ok: true }));

  app.post('/register', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (req, reply) => {
    const { email = '', password = '', name = '', role = '', mobile = '', location = '' } = req.body || {};
    const emailLower = email.toLowerCase();

    if (!emailLower || !password) {
      return reply.code(400).send({ error: 'email_password_required' });
    }

    // ✅ Check if user already exists in db.users
    const existing = await repo.getUserByEmail(emailLower);
    if (existing) {
      return reply.code(409).send({ error: 'email_exists' });
    }

    const passHash = await bcrypt.hash(password, 10);
    const id = `u_${Date.now()}`;
    const sitterId = `s_${Date.now()}`;
    const isAdmin = emailLower.endsWith('@aj-beattie.com');

    // Create business for this new user
    const business = await repo.createBusiness({
      name: `${name || 'My'} Business`,
      ownerUserId: id,
    });

    // Create CRM user record in db.users (this is our single source of truth now)
    const user = await repo.createUser({
      id,
      businessId: business.id,
      role: role || 'ADMIN',
      name: name || 'New User',
      email: emailLower,
      phone: mobile || '',
      active: true,
      passHash,
      isAdmin,
    });

    console.log(`✓ Created business ${business.id} and auth user ${emailLower}`);

    const token = app.jwt.sign({
      sub: user.id,
      email: user.email,
      sitterId,
      isAdmin: !!user.isAdmin,
    });

    reply.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { token, user: await publicUser(user) };
  });

  app.post('/login', {
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '15 minutes',
        keyGenerator: function(request) {
          const emailLower = (request.body?.email || '').toLowerCase();
          return `${request.ip}:${emailLower}`;
        }
      }
    }
  }, async (req, reply) => {
    const { email = '', password = '' } = req.body || {};
    const emailLower = email.toLowerCase();

    if (!emailLower || !password) {
      return reply.code(400).send({ error: 'email_password_required' });
    }

    // ✅ Look up user from unified db.users via repo
    const u = await repo.getUserByEmail(emailLower);
    if (!u || !u.passHash) {
      trackFailedLogin(req.ip, emailLower);
      return reply.code(401).send({ error: 'invalid_credentials' });
    }

    const ok = await bcrypt.compare(password, u.passHash);
    if (!ok) {
      trackFailedLogin(req.ip, emailLower);
      return reply.code(401).send({ error: 'invalid_credentials' });
    }
    
    // Clear failed login tracking on successful login
    clearFailedLogins(req.ip);

    // Auto-create client CRM record if user is a client and doesn't have one
    if (u.role === 'client' && !u.crmClientId) {
      let clientRecord = Object.values(db.clients).find(
        (c) => c.userId === u.id || c.email === u.email
      );

      if (!clientRecord) {
        const newClientId = `c_${Date.now()}_${Math.random().toString(36).slice(2)}`;
        clientRecord = {
          id: newClientId,
          userId: u.id,
          businessId: u.businessId,
          firstName: u.name?.split(' ')[0] || '',
          lastName: u.name?.split(' ').slice(1).join(' ') || '',
          email: u.email,
          phone: u.phone || '',
          addressLine1: '',
          city: '',
          postcode: '',
          emergencyContact: '',
          vetDetails: '',
          notes: '',
          profileComplete: false,
          createdAt: new Date().toISOString(),
        };
        db.clients[newClientId] = clientRecord;
        console.log(`✓ Auto-created client CRM record ${newClientId} for user ${u.email}`);
      }

      u.crmClientId = clientRecord.id;
    }

    const token = app.jwt.sign({
      sub: u.id,
      email: u.email,
      sitterId: u.sitterId,
      isAdmin: !!u.isAdmin,
    });

    reply.setCookie('token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return { token, user: await publicUser(u) };
  });

  app.post('/logout', async (req, reply) => {
    reply.clearCookie('token', { path: '/' });
    return { ok: true };
  });

  app.get('/me', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization||'').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      // ✅ Use repo.getUser() instead of users Map to get businessId
      const u = await repo.getUser(payload.sub);
      if (!u) return reply.code(401).send({ error: 'unauthenticated' });
      return { user: await publicUser(u) };
    } catch {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  });

  // DEV ONLY: Set admin role for testing
  app.post('/dev/make-admin', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization||'').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      // ✅ Use repo.getUser() instead of users Map
      const u = await repo.getUser(payload.sub);
      if (!u) return reply.code(401).send({ error: 'unauthenticated' });
      
      u.isAdmin = true;
      const newToken = app.jwt.sign({ sub: u.id, email: u.email, sitterId: u.sitterId, isAdmin: true });
      reply.setCookie('token', newToken, { httpOnly: true, sameSite: 'lax', path: '/' });
      return { token: newToken, user: await publicUser(u) };
    } catch {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  });

  // DEV ONLY: Create business and assign to current user
  app.post('/dev/create-business', async (req, reply) => {
    try {
      const token = req.cookies?.token || (req.headers.authorization||'').replace('Bearer ', '');
      const payload = app.jwt.verify(token);
      // ✅ Use repo.getUser() instead of users Map
      const u = await repo.getUser(payload.sub);
      if (!u) return reply.code(401).send({ error: 'unauthenticated' });
      
      let businessId;
      if (u.businessId) {
        businessId = u.businessId;
      } else {
        // Create a new business
        const business = await repo.createBusiness({
          name: `${u.name || 'User'}'s Business`,
          ownerUserId: u.id
        });
        businessId = business.id;
        
        // Update user with businessId
        await repo.updateUser(u.id, { businessId: business.id });
      }
      
      // Return updated user
      const updatedUser = await repo.getUser(u.id);
      return { user: await publicUser(updatedUser), businessId };
    } catch (err) {
      console.error('Failed to create business:', err);
      return reply.code(500).send({ error: 'failed_to_create_business' });
    }
  });
}
