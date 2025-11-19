import bcrypt from 'bcryptjs';
import * as repo from './repo.js';

// In-memory fallback user store for MVP (replace with DB later)
export const users = new Map(); // key: email, value: { id, email, name, passHash, sitterId, isAdmin }

export default async function authRoutes(app){

  async function publicUser(u){ 
    // Look up businessId from db.users if not in auth user record
    let businessId = u.businessId;
    if (!businessId) {
      const dbUsers = await repo.listUsers();
      const dbUser = dbUsers.find(user => user.id === u.id);
      if (dbUser) {
        businessId = dbUser.businessId;
      }
    }
    return { id: u.id, email: u.email, name: u.name, sitterId: u.sitterId, businessId, isAdmin: u.isAdmin || false }; 
  }

  app.get('/health', async () => ({ ok: true }));

  app.post('/register', async (req, reply) => {
    const { email='', password='', name='', role='', mobile='', location='' } = req.body || {};
    if (!email || !password) return reply.code(400).send({ error: 'email_password_required' });
    if (users.has(email)) return reply.code(409).send({ error: 'email_exists' });

    const passHash = await bcrypt.hash(password, 10);
    const id = `u_${Date.now()}`;
    const sitterId = `s_${Date.now()}`; // auto-provision a sitter profile id
    const isAdmin = email.toLowerCase().endsWith('@aj-beattie.com');
    const user = { id, email: email.toLowerCase(), name: name || 'New User', passHash, sitterId, isAdmin, role: role || 'owner' };
    users.set(user.email, user);

    // Create initial sitter profile (for both owners and companions)
    const sitterResponse = await fetch(`http://localhost:${process.env.API_PORT || 8787}/api/sitters/${sitterId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name || 'New User',
        city: location || '',
        postcode: location || '',
        mobile: mobile || '',
        bio: '',
        avatarUrl: 'https://placehold.co/256x256?text=' + encodeURIComponent(name || 'NU'),
        bannerUrl: 'https://placehold.co/1200x400?text=Pawtimation',
        yearsExperience: 0,
        services: [],
        verification: { email: false, sms: false, stripe: false, trainee: false, pro: false }
      })
    });

    // Auto-create business for new user
    const business = await repo.createBusiness({
      name: `${name || 'My'} Business`,
      ownerUserId: id
    });
    
    await repo.createUser({
      id,
      businessId: business.id,
      role: 'ADMIN',
      name: name || 'New User',
      email: email.toLowerCase(),
      phone: mobile || '',
      active: true
    });
    
    // Update in-memory user with businessId
    user.businessId = business.id;
    
    console.log(`✓ Created business ${business.id} for new user ${email}`);

    const token = app.jwt.sign({ sub: id, email: user.email, sitterId, isAdmin: user.isAdmin });
    reply.setCookie('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { token, user: await publicUser(user) };
  });

  app.post('/login', async (req, reply) => {
    const { email='', password='' } = req.body || {};
    const u = users.get(email.toLowerCase());
    if (!u) return reply.code(401).send({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, u.passHash);
    if (!ok) return reply.code(401).send({ error: 'invalid_credentials' });
    
    // Auto-create business for ALL users without one
    const dbUsers = await repo.listUsers();
    let dbUser = dbUsers.find(user => user.id === u.id);
    
    if (!dbUser || !dbUser.businessId) {
      // Create a new business
      const business = await repo.createBusiness({
        name: `${u.name || 'My'} Business`,
        ownerUserId: u.id
      });
      
      console.log(`✓ Created business ${business.id} for user ${u.email}`);
      
      // Create or update user in db.users
      if (dbUser) {
        await repo.updateUser(dbUser.id, { businessId: business.id });
        dbUser.businessId = business.id; // Update local reference
      } else {
        dbUser = await repo.createUser({
          id: u.id,
          businessId: business.id,
          role: 'ADMIN',
          name: u.name,
          email: u.email,
          phone: '',
          active: true
        });
      }
      
      // Update the in-memory user object with businessId
      u.businessId = business.id;
    }
    
    const token = app.jwt.sign({ sub: u.id, email: u.email, sitterId: u.sitterId, isAdmin: u.isAdmin || false });
    reply.setCookie('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
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
      const u = [...users.values()].find(x => x.id === payload.sub);
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
      const u = [...users.values()].find(x => x.id === payload.sub);
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
      const u = [...users.values()].find(x => x.id === payload.sub);
      if (!u) return reply.code(401).send({ error: 'unauthenticated' });
      
      // Import repo dynamically
      const { repo } = await import('./repo.js');
      
      // Check if user already has a business
      const dbUsers = await repo.listUsers();
      const dbUser = dbUsers.find(user => user.id === u.id);
      
      let businessId;
      if (dbUser && dbUser.businessId) {
        businessId = dbUser.businessId;
      } else {
        // Create a new business
        const business = await repo.createBusiness({
          name: `${u.name || 'User'}'s Business`,
          ownerUserId: u.id
        });
        businessId = business.id;
        
        // Create or update user in db.users
        if (dbUser) {
          await repo.updateUser(dbUser.id, { businessId: business.id });
        } else {
          await repo.createUser({
            id: u.id,
            businessId: business.id,
            role: 'ADMIN',
            name: u.name,
            email: u.email,
            phone: '',
            active: true
          });
        }
      }
      
      // Return updated user
      return { user: await publicUser(u), businessId };
    } catch (err) {
      console.error('Failed to create business:', err);
      return reply.code(500).send({ error: 'failed_to_create_business' });
    }
  });
}
