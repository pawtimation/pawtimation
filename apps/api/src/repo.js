import { db } from './store.js'; import { nid } from './utils.js';
export const repo = {
  db,
  async createInvite(data){ const id=nid(); db.invites[id]={id,...data}; return db.invites[id]; },
  async getInvite(id){ return db.invites[id]||null },
  async setInviteStatus(id,status){ if(db.invites[id]) db.invites[id].status=status; return db.invites[id] },
  async createBooking(data){ const id=nid(); db.bookings[id]={id,...data}; db.updates[id]=[]; return db.bookings[id]; },
  async getBooking(id){ return db.bookings[id]||null },
  async addUpdate(bid,upd){ db.updates[bid]=db.updates[bid]||[]; db.updates[bid].push(upd); return upd; },
  async getFeed(id){ return { booking: db.bookings[id], updates: db.updates[id]||[] } },
  async getSitterById(id){ return db.sitters[id]||null },
  async upsertSitter(p){ const id=p.id||p.userId||nid(); db.sitters[id]={...(db.sitters[id]||{}), id, ...p}; return db.sitters[id] },
  async updateSitterTier(id,t){ if(!db.sitters[id]) return null; db.sitters[id].tier=t; return db.sitters[id] },
  async getReferencesBySitterId(){ return [] },
  async getSitterAgreements(sid){ return Object.values(db.agreements).filter(a=>a.sitterId===sid) },
  async addSitterAgreement(a){ const id=a.id||('agr_'+nid()); db.agreements[id]={id,...a}; return db.agreements[id] },
  async recordCancellation(evt){ const id='cx_'+nid(); db.cancellations[id]={id,...evt,occurredAt:new Date().toISOString()}; return db.cancellations[id] },
  async setBookingStatus(id,status){ if(db.bookings[id]) db.bookings[id].status=status; return db.bookings[id] },
  async markBookingPaid(id,pi){ if(db.bookings[id]) db.bookings[id].escrowId=pi; return db.bookings[id] }
};
