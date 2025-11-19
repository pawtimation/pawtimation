import Fastify from 'fastify';import fastifyCors from '@fastify/cors';import { API_PORT } from './config.js';
import { repo } from './repo.js';import { nid, isoNow, daysBetween } from './utils.js';import { makeDiary } from './aiDiaryStub.js';
import { startAgents } from './agents/index.js';import stripeConnectRoutes from './stripeConnectRoutes.js';
import agreementsRoutes from './agreementsRoutes.js';import cancellationRoutes from './cancellationRoutes.js';
import accessRoutes from './accessRoutes.js';import arrivalRoutes from './arrivalRoutes.js';
import ownersRoutes from './ownersRoutes.js';import sitterRoutes from './sitterRoutes.js';
import pawtimateRoutes from './pawtimateRoutes.js';import preferencesRoutes from './preferencesRoutes.js';
import incidentsRoutes from './incidentsRoutes.js';import rewardsRoutes from './rewardsRoutes.js';
import bookingCompletionRoutes from './bookingCompletionRoutes.js';
import ownerCircleRoutes from './ownerRoutes.js';
import chatRoutes, { setupChatSockets } from './chatRoutes.js';
import jwt from '@fastify/jwt';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true }); app.register(fastifyCors, { origin: '*' });
await app.register(cookie, { hook: 'onRequest' });
await app.register(jwt, { secret: process.env.JWT_SECRET || 'dev-secret-change-me' });

// Health check endpoint for deployment
app.get('/health', async ()=>({ ok:true, ts: isoNow() }));

// Serve static files from frontend build (production only)
const webDistPath = path.join(__dirname, '../../web/dist');
try {
  await app.register(fastifyStatic, {
    root: webDistPath,
    prefix: '/',
    decorateReply: false
  });
} catch (err) {
  console.log('Static files not available, running in API-only mode');
}

app.post('/friends/invite', async (req, reply)=>{
  const { ownerEmail, friendEmail, petName='H', startDate, endDate, ratePerDay=1500, insuranceAddon=0 } = req.body || {};
  if(!ownerEmail || !friendEmail || !startDate || !endDate) return reply.code(400).send({error:'Missing fields'});
  const days = daysBetween(startDate, endDate);
  const total = days * ratePerDay + insuranceAddon;
  const inv = await repo.createInvite({ ownerEmail, friendEmail, petName, startDate, endDate, ratePerDay, insuranceAddon, total, status:'PENDING' });
  return { inviteId: inv.id, summary: { days, total } };
});

app.post('/friends/accept', async (req, reply)=>{
  const { inviteId } = req.body || {};
  const inv = await repo.getInvite(inviteId);
  if(!inv) return reply.code(404).send({error:'Invite not found'});
  await repo.setInviteStatus(inviteId, 'ACCEPTED')
  const booking = await repo.createBooking({
    ownerEmail: inv.ownerEmail, sitterKind:'FRIEND', friendEmail: inv.friendEmail,
    petName: inv.petName, startDate: inv.startDate, endDate: inv.endDate,
    ratePerDay: inv.ratePerDay, insuranceAddon: inv.insuranceAddon,
    status:'CONFIRMED', escrowId:'pi_demo_'+nid(), total: inv.total
  });
  return { bookingId: booking.id, escrow: { id: booking.escrowId, clientSecret: 'cs_demo_'+nid() } };
});

app.post('/bookings/:id/update', async (req, reply)=>{
  const { id } = req.params; const booking = await repo.getBooking(id);
  if(!booking) return reply.code(404).send({error:'Booking not found'});
  const { type='NOTE', text='', contentUrl='' } = req.body || {};
  const aiDiary = makeDiary({ petName: booking.petName, notes: text, events: type!=='NOTE'?[type]:[] });
  const update = { type, text, contentUrl, aiDiary, ts: isoNow() };
  await repo.addUpdate(id, update); return { ok:true, update };
});

app.get('/bookings/:id/feed', async (req, reply)=>{
  const { id } = req.params; const feed = await repo.getFeed(id);
  if(!feed.booking) return reply.code(404).send({error:'Booking not found'}); return feed;
});

app.get('/sitters/search', async (req, reply)=>{
  const { tier, postcode='HP20' } = req.query || {};
  let sitters = await repo.getAllSitters();
  
  if(tier && tier !== 'ANY') {
    sitters = sitters.filter(s => s.tier === tier);
  }
  
  if(postcode) {
    sitters = sitters.filter(s => s.postcode?.startsWith(postcode.split(' ')[0]));
  }
  
  return { results:sitters };
});

await app.register((await import('./authRoutes.js')).default, { prefix: '/api/auth' });

// Initialize demo client account for testing
import bcrypt from 'bcryptjs';
import { users } from './authRoutes.js';
if (!users.has('demo@client.com')) {
  const passHash = await bcrypt.hash('test123', 10);
  const clientId = 'u_demo_client';
  const sitterId = 's_demo_client';
  users.set('demo@client.com', {
    id: clientId,
    email: 'demo@client.com',
    name: 'Demo Client',
    passHash,
    sitterId,
    isAdmin: false,
    role: 'client',
    crmClientId: 'c_demo_client' // Link to CRM client record
  });
  
  // Create a CRM client record for the demo client
  const businesses = await repo.listBusinesses();
  let demoBiz = businesses[0];
  if (!demoBiz) {
    demoBiz = await repo.createBusiness({
      name: 'Demo Dog Walking'
    });
  }
  
  // Check if CRM client record already exists
  const existingClient = await repo.getClient('c_demo_client');
  if (!existingClient) {
    await repo.createClient({
      id: 'c_demo_client',
      businessId: demoBiz.id,
      name: 'Demo Client',
      email: 'demo@client.com',
      phone: '+44 7700 900123',
      profileComplete: true // Mark as complete so they can access the dashboard
    });
    console.log('✓ Demo CRM client record created');
  }
  
  console.log('✓ Demo client auth account created: demo@client.com / test123');
}

await app.register((await import('./adminRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./aiRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./companionRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./communityRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./supportRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./planRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./pawbotRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./eventsRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./billingRoutes.js')).default, { prefix: '/api' });
await app.register(agreementsRoutes, { prefix: '/api' }); await app.register(cancellationRoutes, { prefix: '/api' }); await app.register(stripeConnectRoutes, { prefix: '/api' }); await app.register(accessRoutes, { prefix: '/api' }); await app.register(arrivalRoutes, { prefix: '/api' }); await app.register(ownersRoutes, { prefix: '/api' }); await app.register(sitterRoutes, { prefix: '/api' }); await app.register(pawtimateRoutes, { prefix: '/api' }); await app.register(preferencesRoutes, { prefix: '/api' }); await app.register(incidentsRoutes, { prefix: '/api' }); await app.register(rewardsRoutes, { prefix: '/api' }); await app.register(bookingCompletionRoutes, { prefix: '/api' });
await app.register(ownerCircleRoutes, { prefix: '/api' });
await app.register(chatRoutes, { prefix: '/api' });
await app.register((await import('./petRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./bookingRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./uploadRoutes.js')).default, { prefix: '/api' });

await app.listen({ port: Number(API_PORT), host: '0.0.0.0' });
console.log('API on :'+API_PORT);

const io = new SocketIOServer(app.server, { cors: { origin: '*', credentials: true } });
setupChatSockets(io);

startAgents();
