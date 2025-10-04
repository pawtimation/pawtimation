import bcrypt from 'bcryptjs';

// In-memory fallback user store for MVP (replace with DB later)
const users = new Map(); // key: email, value: { id, email, name, passHash, sitterId }

export default async function authRoutes(app){

  function publicUser(u){ return { id: u.id, email: u.email, name: u.name, sitterId: u.sitterId }; }

  app.post('/register', async (req, reply) => {
    const { email='', password='', name='' } = req.body || {};
    if (!email || !password) return reply.code(400).send({ error: 'email_password_required' });
    if (users.has(email)) return reply.code(409).send({ error: 'email_exists' });

    const passHash = await bcrypt.hash(password, 10);
    const id = `u_${Date.now()}`;
    const sitterId = `s_${Date.now()}`; // auto-provision a sitter profile id
    const user = { id, email: email.toLowerCase(), name: name || 'New Companion', passHash, sitterId };
    users.set(user.email, user);

    const token = app.jwt.sign({ sub: id, email: user.email, sitterId });
    reply.setCookie('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { token, user: publicUser(user) };
  });

  app.post('/login', async (req, reply) => {
    const { email='', password='' } = req.body || {};
    const u = users.get(email.toLowerCase());
    if (!u) return reply.code(401).send({ error: 'invalid_credentials' });
    const ok = await bcrypt.compare(password, u.passHash);
    if (!ok) return reply.code(401).send({ error: 'invalid_credentials' });
    const token = app.jwt.sign({ sub: u.id, email: u.email, sitterId: u.sitterId });
    reply.setCookie('token', token, { httpOnly: true, sameSite: 'lax', path: '/' });
    return { token, user: publicUser(u) };
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
      return { user: publicUser(u) };
    } catch {
      return reply.code(401).send({ error: 'unauthenticated' });
    }
  });
}
