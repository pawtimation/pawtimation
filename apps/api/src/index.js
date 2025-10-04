import Fastify from 'fastify';import fastifyCors from '@fastify/cors';import { API_PORT } from './config.js';
import { repo } from './repo.js';import { nid, isoNow, daysBetween } from './utils.js';import { makeDiary } from './aiDiaryStub.js';
import { startAgents } from './agents/index.js';import stripeConnectRoutes from './stripeConnectRoutes.js';
import agreementsRoutes from './agreementsRoutes.js';import cancellationRoutes from './cancellationRoutes.js';
import accessRoutes from './accessRoutes.js';import arrivalRoutes from './arrivalRoutes.js';
import ownersRoutes from './ownersRoutes.js';import sitterRoutes from './sitterRoutes.js';
import pawtimateRoutes from './pawtimateRoutes.js';

const app = Fastify({ logger: true }); app.register(fastifyCors, { origin: '*' });
app.get('/health', async ()=>({ ok:true, ts: isoNow() }));

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

await app.register(agreementsRoutes); await app.register(cancellationRoutes); await app.register(stripeConnectRoutes); await app.register(accessRoutes); await app.register(arrivalRoutes); await app.register(ownersRoutes); await app.register(sitterRoutes); await app.register(pawtimateRoutes);
startAgents();
app.listen({ port: Number(API_PORT), host: '0.0.0.0' }).then(()=>console.log('API on :'+API_PORT)).catch(e=>{console.error(e);process.exit(1)});
