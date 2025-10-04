import { scoreSitter, dateSpan } from './assigner.js';

const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const sitters = (mem.sitters = mem.sitters || new Map());
const owners = (mem.owners = mem.owners || new Map());
const pets = (mem.pets = mem.pets || new Map());
const bookings = (mem.bookings = mem.bookings || new Map());

function newid(prefix){ return `${prefix}_${Math.random().toString(36).slice(2,10)}`; }

export default async function bookingRoutes(app){

  app.post('/bookings/auto-assign', async (req, reply)=>{
    const body = req.body || {};
    const owner = owners.get(body.ownerId) || body.owner || {};
    const reqSpec = {
      serviceKey: body.serviceKey,
      fromISO: body.fromISO,
      toISO: body.toISO,
      budget: body.budget
    };

    const days = dateSpan(reqSpec.fromISO, reqSpec.toISO);

    const scored = [...sitters.values()].map(s=>{
      const sc = scoreSitter({ sitter: s, owner, req: reqSpec });
      return { sitter: s, score: sc };
    }).filter(x=>x.score.total>0);

    scored.sort((a,b)=> b.score.total - a.score.total);

    const assigned = scored[0] || null;
    const alternates = scored.slice(1,4);

    return {
      assigned: assigned ? { id: assigned.sitter.id, name: assigned.sitter.name, score: assigned.score } : null,
      alternates: alternates.map(x=>({ id:x.sitter.id, name:x.sitter.name, score:x.score })),
      request: reqSpec,
      considered: scored.length
    };
  });

  app.post('/bookings', async (req)=>{
    const b = req.body || {};
    const id = newid('bk');
    const record = {
      id,
      ownerId: b.ownerId,
      petId: b.petId,
      sitterId: b.sitterId,
      serviceKey: b.serviceKey,
      fromISO: b.fromISO,
      toISO: b.toISO,
      priceQuoted: b.priceQuoted ?? 0,
      status: 'pending',
      createdAt: Date.now()
    };
    bookings.set(id, record);
    return { ok:true, booking: record };
  });

  app.get('/owners/:id/bookings', async (req)=>{
    const list = [...bookings.values()].filter(b=>b.ownerId===req.params.id);
    return { bookings: list };
  });
}
