import { nanoid } from 'nanoid';

const rooms = new Map(); // roomId -> { name, type:'community'|'private', messages:[{id,user,text,ts}] }
rooms.set('community', { name:'Community', type:'community', messages:[] });

function getRoom(id){
  if(!rooms.has(id)) rooms.set(id, { name:'Private', type:'private', messages:[] });
  return rooms.get(id);
}

// REST routes
export default async function chatRoutes(app){
  // REST: load recent
  app.get('/chat/room/:roomId', async (req, reply) => {
    const r = getRoom(req.params.roomId);
    return { roomId: req.params.roomId, name:r.name, type:r.type, messages: r.messages.slice(-50) };
  });

  // Create a private room
  app.post('/chat/private', async (req, reply) => {
    const { label='Private chat' } = req.body||{};
    const code = `dm_${nanoid(8)}`;
    rooms.set(code, { name: label, type:'private', messages:[] });
    return { roomId: code, joinUrl: `/chat?room=${code}` };
  });

  // Deterministic DM for owner + friend
  app.post('/chat/dm', async (req, reply) => {
    const { ownerId = '', friendId = '', label = 'Direct message' } = req.body || {};
    if (!ownerId || !friendId) return reply.code(400).send({ error: 'ownerId_friendId_required' });
    const roomId = `dm_${ownerId}_${friendId}`;
    if (!rooms.has(roomId)) rooms.set(roomId, { name: label, type: 'private', messages: [] });
    return { roomId, joinUrl: `/chat?room=${roomId}` };
  });
}

// Socket.io handlers (to be called after server starts)
export function setupChatSockets(io){
  io.on('connection', (socket) => {
    socket.on('join', ({ roomId }) => {
      getRoom(roomId);
      socket.join(roomId);
      socket.emit('joined', { roomId });
    });
    socket.on('message', ({ roomId, user, text }) => {
      if(!roomId || !text) return;
      const msg = { id:nanoid(10), user:user||'Guest', text:String(text).slice(0,1000), ts:Date.now() };
      const r = getRoom(roomId);
      r.messages.push(msg);
      if(r.messages.length>500) r.messages.splice(0, r.messages.length-500);
      socket.to(roomId).emit('message', msg);
      socket.emit('message', msg);
    });
  });
}
