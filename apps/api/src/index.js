import Fastify from 'fastify';import fastifyCors from '@fastify/cors';import { API_PORT } from './config.js';
import { repo, getUserByEmail } from './repo.js';import { nid, isoNow, daysBetween } from './utils.js';import { makeDiary } from './aiDiaryStub.js';
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
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = Fastify({ logger: true }); app.register(fastifyCors, { origin: true, credentials: true });
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

// Initialize demo accounts for testing
import bcrypt from 'bcryptjs';

// 1. Create demo business with services
const businesses = await repo.listBusinesses();
let demoBiz = businesses[0];
if (!demoBiz) {
  demoBiz = await repo.createBusiness({
    name: 'Demo Dog Walking',
    id: 'biz_demo'
  });
  console.log('✓ Demo business created');
}

// Ensure demo business has services
const existingServices = await repo.listServicesByBusiness(demoBiz.id);
if (existingServices.length === 0) {
  await repo.createService({
    businessId: demoBiz.id,
    name: '30min Dog Walk',
    durationMinutes: 30,
    priceCents: 1500, // £15.00
    visibleToClients: true
  });
  await repo.createService({
    businessId: demoBiz.id,
    name: '60min Dog Walk',
    durationMinutes: 60,
    priceCents: 2500, // £25.00
    visibleToClients: true
  });
  console.log('✓ Demo services created');
}

// 2. Create demo admin accounts
const adminEmail = 'admin@demo.com';
const existingAdmin = await getUserByEmail(adminEmail);
if (!existingAdmin) {
  const passHash = await bcrypt.hash('admin123', 10);
  await repo.createUser({
    id: 'u_demo_admin',
    businessId: demoBiz.id,
    role: 'ADMIN',
    name: 'Demo Admin',
    email: adminEmail,
    passHash,
    isAdmin: false
  });
  console.log('✓ Demo admin account created: admin@demo.com / admin123');
}

// Create reliable seeded admin for Pawtimation
const pawtimationAdminEmail = 'demo-admin@pawtimation.com';
const existingPawtimationAdmin = await getUserByEmail(pawtimationAdminEmail);
if (!existingPawtimationAdmin) {
  const passHash = await bcrypt.hash('demo123', 10);
  await repo.createUser({
    id: 'u_pawtimation_admin',
    businessId: demoBiz.id,
    role: 'ADMIN',
    name: 'Pawtimation Admin',
    email: pawtimationAdminEmail,
    passHash,
    isAdmin: false
  });
  console.log('✓ Pawtimation admin account created: demo-admin@pawtimation.com / demo123');
}

// 2.5 Create demo staff members
const allServices = await repo.listServicesByBusiness(demoBiz.id);
const staff1Email = 'walker1@demo.com';
const existingStaff1 = await getUserByEmail(staff1Email);
if (!existingStaff1) {
  const passHash = await bcrypt.hash('staff123', 10);
  const staff1 = await repo.createUser({
    id: 'u_demo_staff1',
    businessId: demoBiz.id,
    role: 'STAFF',
    name: 'Sarah Walker',
    email: staff1Email,
    phone: '07712 345678',
    passHash,
    isAdmin: false
  });
  
  // Directly set services on the created user object
  if (staff1 && allServices.length > 0) {
    staff1.services = allServices.map(s => s.id);
  }
  
  // Set weekly availability (Mon-Fri, 9am-5pm)
  await repo.saveStaffWeeklyAvailability('u_demo_staff1', {
    Mon: { start: '09:00', end: '17:00' },
    Tue: { start: '09:00', end: '17:00' },
    Wed: { start: '09:00', end: '17:00' },
    Thu: { start: '09:00', end: '17:00' },
    Fri: { start: '09:00', end: '17:00' }
  });
  console.log('✓ Demo staff created: walker1@demo.com / staff123');
} else {
  // Update existing staff with phone number if missing
  if (!existingStaff1.phone) {
    existingStaff1.phone = '07712 345678';
  }
}

const staff2Email = 'walker2@demo.com';
const existingStaff2 = await getUserByEmail(staff2Email);
if (!existingStaff2) {
  const passHash = await bcrypt.hash('staff123', 10);
  const staff2 = await repo.createUser({
    id: 'u_demo_staff2',
    businessId: demoBiz.id,
    role: 'STAFF',
    name: 'John Walker',
    email: staff2Email,
    passHash,
    isAdmin: false
  });
  
  // Directly set services on the created user object
  if (staff2 && allServices.length > 0) {
    staff2.services = allServices.map(s => s.id);
  }
  
  // Set weekly availability (Mon-Sun, 10am-6pm)
  await repo.saveStaffWeeklyAvailability('u_demo_staff2', {
    Mon: { start: '10:00', end: '18:00' },
    Tue: { start: '10:00', end: '18:00' },
    Wed: { start: '10:00', end: '18:00' },
    Thu: { start: '10:00', end: '18:00' },
    Fri: { start: '10:00', end: '18:00' },
    Sat: { start: '10:00', end: '16:00' },
    Sun: { start: '10:00', end: '16:00' }
  });
  console.log('✓ Demo staff created: walker2@demo.com / staff123');
}

// 3. Create demo client account
const clientEmail = 'demo@client.com';
const existingClientUser = await getUserByEmail(clientEmail);
if (!existingClientUser) {
  const passHash = await bcrypt.hash('test123', 10);
  await repo.createUser({
    id: 'u_demo_client',
    businessId: demoBiz.id,
    role: 'client',
    name: 'Demo Client',
    email: clientEmail,
    passHash,
    isAdmin: false,
    crmClientId: 'c_demo_client'
  });
  console.log('✓ Demo client account created: demo@client.com / test123');
}

// Create or update CRM client record (always runs to ensure address is up to date)
const existingClient = await repo.getClient('c_demo_client');
if (!existingClient) {
  await repo.createClient({
    id: 'c_demo_client',
    businessId: demoBiz.id,
    name: 'Demo Client',
    email: clientEmail,
    phone: '07565613567',
    addressLine1: '5 Charles Kidnee Way',
    city: 'Stoke Mandeville',
    postcode: 'HP223AA',
    lat: 51.7955,
    lng: -0.8055,
    profileComplete: true
  });
  console.log('✓ Demo CRM client record created');
} else {
  // Update existing client with latest address details
  await repo.updateClient('c_demo_client', {
    phone: '07565613567',
    addressLine1: '5 Charles Kidnee Way',
    city: 'Stoke Mandeville',
    postcode: 'HP223AA',
    lat: 51.7955,
    lng: -0.8055
  });
  console.log('✓ Demo CRM client record updated with address');
}

// Create demo dog if it doesn't exist
const existingDog = await repo.getDog('dog_demo');
if (!existingDog) {
  await repo.createDog({
    id: 'dog_demo',
    clientId: 'c_demo_client',
    businessId: demoBiz.id,
    name: 'Max',
    breed: 'Golden Retriever',
    age: 3,
    notes: 'Friendly dog'
  });
  console.log('✓ Demo dog created');
}

await app.register((await import('./adminRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./routes/businessServicesRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./routes/automationRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./routes/statsRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./routes/jobRoutes.js')).jobRoutes, { prefix: '/api' });
await app.register((await import('./routes/messageRoutes.js')).messageRoutes, { prefix: '/api' });
await app.register((await import('./routes/clientRoutes.js')).clientRoutes, { prefix: '/api' });
await app.register((await import('./routes/invoiceRoutes.js')).invoiceRoutes, { prefix: '/api' });
await app.register((await import('./routes/financeRoutes.js')).default, { prefix: '/api' });
await app.register((await import('./routes/businessSettingsRoutes.js')).businessSettingsRoutes, { prefix: '/api' });
await app.register((await import('./routes/staffRoutes.js')).staffRoutes, { prefix: '/api' });
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
await app.register((await import('./routes/betaRoutes.js')).betaRoutes, { prefix: '/api' });

// ---------------------------------------------
// SPA FALLBACK — Serve index.html for all non-API routes
// ---------------------------------------------
const indexHtmlPath = path.join(webDistPath, 'index.html');
let indexHtmlContent;

try {
  indexHtmlContent = readFileSync(indexHtmlPath, 'utf-8');
} catch (err) {
  console.log('index.html not found, SPA fallback disabled');
}

app.setNotFoundHandler(async (req, reply) => {
  // If it's an API route, return 404 JSON
  if (req.url.startsWith('/api')) {
    return reply.code(404).send({ error: 'Not found' });
  }

  // Otherwise, serve index.html for SPA routing
  if (indexHtmlContent) {
    return reply.type('text/html').send(indexHtmlContent);
  } else {
    return reply.code(404).send({ error: 'Not found' });
  }
});

await app.listen({ port: Number(API_PORT), host: '0.0.0.0' });
console.log('API on :'+API_PORT);

const io = new SocketIOServer(app.server, { cors: { origin: '*', credentials: true } });
setupChatSockets(io);

const { setSocketIOInstance } = await import('./lib/socketEvents.js');
setSocketIOInstance(io);

startAgents();
