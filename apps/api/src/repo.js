import { db } from './store.js'; import { nid } from './utils.js';
export const repo = {
  db,
  async createInvite(data){ const id=nid(); db.invites[id]={id,...data}; return db.invites[id]; },
  async getInvite(id){ return db.invites[id]||null },
  async setInviteStatus(id,status){ if(db.invites[id]) db.invites[id].status=status; return db.invites[id] },
  async createBooking(data){ 
    if(data.sitterId){
      const sitter = db.sitters[data.sitterId];
      if(sitter && sitter.suspended){
        throw new Error('Cannot create booking: Companion is suspended');
      }
    }
    const id=nid(); 
    db.bookings[id]={id,...data}; 
    db.updates[id]=[]; 
    return db.bookings[id]; 
  },
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
  async markBookingPaid(id,pi){ if(db.bookings[id]) db.bookings[id].escrowId=pi; return db.bookings[id] },
  async setAvailability(userId, dates){ db.availability[userId] = dates; return dates; },
  async getAvailability(userId){ return db.availability[userId] || []; },
  async createBookingRequest(data){ const id=nid(); db.bookingRequests[id]={id,...data,createdAt:new Date().toISOString()}; return db.bookingRequests[id]; },
  async getBookingRequest(id){ return db.bookingRequests[id]||null },
  async getAllSitters(){ return Object.values(db.sitters); },
  async setOwnerPreference(ownerEmail, sitterId, preference){ 
    if(!db.ownerPreferences[ownerEmail]) db.ownerPreferences[ownerEmail] = {};
    db.ownerPreferences[ownerEmail][sitterId] = { ...preference, updatedAt: new Date().toISOString() };
    return db.ownerPreferences[ownerEmail][sitterId];
  },
  async getOwnerPreferences(ownerEmail){ return db.ownerPreferences[ownerEmail] || {}; },
  async hasOwnerPawedSitter(ownerEmail, sitterId){ 
    return db.ownerPreferences[ownerEmail]?.[sitterId]?.pawed === true;
  },
  async createIncident(data){ 
    const id='inc_'+nid(); 
    db.incidents[id]={
      id,
      ...data,
      status:'NEW',
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    }; 
    return db.incidents[id]; 
  },
  async getIncident(id){ return db.incidents[id]||null },
  async getAllIncidents(){ return Object.values(db.incidents); },
  async updateIncidentStatus(id, status, reviewNotes){ 
    if(!db.incidents[id]) return null;
    db.incidents[id].status=status;
    db.incidents[id].reviewNotes=reviewNotes;
    db.incidents[id].reviewedAt=new Date().toISOString();
    db.incidents[id].updatedAt=new Date().toISOString();
    return db.incidents[id];
  },
  async addStrike(sitterId, incidentId, reason){ 
    const id='strike_'+nid();
    db.strikes[id]={
      id,
      sitterId,
      incidentId,
      reason,
      issuedAt:new Date().toISOString()
    };
    if(db.sitters[sitterId]){
      db.sitters[sitterId].suspended=true;
      db.sitters[sitterId].suspensionReason=reason;
      db.sitters[sitterId].suspendedAt=new Date().toISOString();
    }
    return db.strikes[id];
  },
  async getSitterStrikes(sitterId){ 
    return Object.values(db.strikes).filter(s=>s.sitterId===sitterId);
  },
  async isSitterSuspended(sitterId){
    return db.sitters[sitterId]?.suspended === true;
  },
  async getBookingCountByOwner(ownerEmail){
    return Object.values(db.bookings).filter(b => b.ownerEmail === ownerEmail && b.status === 'COMPLETED').length;
  },
  async getBookingCountBySitter(sitterId){
    return Object.values(db.bookings).filter(b => b.sitterId === sitterId && b.status === 'COMPLETED').length;
  },
  async getRevenueByOwner(ownerEmail){
    const completedBookings = Object.values(db.bookings).filter(b => b.ownerEmail === ownerEmail && b.status === 'COMPLETED');
    return completedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  },
  async getRevenueBySitter(sitterId){
    const completedBookings = Object.values(db.bookings).filter(b => b.sitterId === sitterId && b.status === 'COMPLETED');
    return completedBookings.reduce((sum, b) => sum + (b.total || 0), 0);
  },
  async checkAndCreateMilestone(userId, userType){
    if(db.milestones[userId]) return db.milestones[userId];
    
    let completedBookings = 0;
    let revenueGenerated = 0;
    
    if(userType === 'OWNER'){
      completedBookings = await this.getBookingCountByOwner(userId);
      revenueGenerated = await this.getRevenueByOwner(userId);
    } else if(userType === 'COMPANION'){
      completedBookings = await this.getBookingCountBySitter(userId);
      revenueGenerated = await this.getRevenueBySitter(userId);
    }
    
    const revenueInPounds = revenueGenerated / 100;
    
    if(completedBookings >= 10 && revenueInPounds >= 500 && !db.milestones[userId]){
      const milestone = {
        id: 'milestone_'+nid(),
        userId,
        userType,
        milestoneType: '10_BOOKINGS_500_REVENUE',
        achievedAt: new Date().toISOString(),
        rewardSent: false,
        rewardValue: 30,
        bookingCount: completedBookings,
        revenueGenerated: revenueInPounds
      };
      db.milestones[userId] = milestone;
      return milestone;
    }
    return null;
  },
  async getMilestone(userId){
    return db.milestones[userId] || null;
  },
  async getPendingRewards(){
    return Object.values(db.milestones).filter(m => !m.rewardSent);
  },
  async markRewardSent(userId, trackingInfo){
    if(db.milestones[userId]){
      db.milestones[userId].rewardSent = true;
      db.milestones[userId].sentAt = new Date().toISOString();
      db.milestones[userId].trackingInfo = trackingInfo;
      return db.milestones[userId];
    }
    return null;
  },
  async setAddress(userId, addressData){
    db.addresses[userId] = {
      userId,
      ...addressData,
      updatedAt: new Date().toISOString()
    };
    return db.addresses[userId];
  },
  async getAddress(userId){
    return db.addresses[userId] || null;
  }
};
