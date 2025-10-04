import { nanoid } from 'nanoid';

const circles = new Map();   // ownerId -> [{ id, name, email, pets:[], isPreferred:false, status:'active'|'invited' }]
const inviteTokens = new Map(); // token -> { ownerId, name, email }

function ensure(ownerId){
  if(!circles.has(ownerId)) circles.set(ownerId, []);
  return circles.get(ownerId);
}

export default async function ownerRoutes(app){

  // List circle
  app.get('/owners/:ownerId/circle', async (req, reply) => {
    const { ownerId } = req.params;
    return { circle: ensure(ownerId) };
  });

  // Invite friend (returns shareable link token)
  app.post('/owners/:ownerId/invite', async (req, reply) => {
    const { ownerId } = req.params;
    const { name='', email='' } = req.body||{};
    if(!email) return reply.code(400).send({ error:'email_required' });
    const token = `inv_${nanoid(10)}`;
    inviteTokens.set(token, { ownerId, name, email: email.toLowerCase() });
    // Add placeholder to circle in "invited" state
    const c = ensure(ownerId);
    const friendId = `f_${Date.now()}`;
    c.push({ id: friendId, name: name||email, email, pets:[], isPreferred:false, status:'invited', token });
    return { token, joinUrl: `/join?token=${token}` };
  });

  // Accept invite (a friend clicking link)
  app.post('/owners/accept', async (req, reply) => {
    const { token='', name='' } = req.body||{};
    const inv = inviteTokens.get(token);
    if(!inv) return reply.code(404).send({ error:'invalid_token' });
    const c = ensure(inv.ownerId);
    const entry = c.find(x => x.token === token);
    if (entry){
      entry.status = 'active';
      if (name) entry.name = name;
      delete entry.token;
    }
    inviteTokens.delete(token);
    return { ok:true, ownerId: inv.ownerId };
  });

  // Toggle preferred
  app.post('/owners/:ownerId/circle/:friendId/preferred', async (req, reply) => {
    const { ownerId, friendId } = req.params;
    const { isPreferred } = req.body||{};
    const c = ensure(ownerId);
    const f = c.find(x => x.id === friendId);
    if(!f) return reply.code(404).send({ error:'not_found' });
    f.isPreferred = !!isPreferred;
    return { ok:true, friend: f };
  });

  // Remove friend
  app.delete('/owners/:ownerId/circle/:friendId', async (req, reply) => {
    const { ownerId, friendId } = req.params;
    const c = ensure(ownerId);
    const i = c.findIndex(x => x.id === friendId);
    if (i>=0) c.splice(i,1);
    return { ok:true };
  });
}
