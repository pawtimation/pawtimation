import { repo } from './repo.js'
import { nid, daysBetween } from './utils.js'

export default async function pawtimateRoutes(app){
  app.post('/pawtimate/request', async (req, reply)=>{
    const { ownerEmail, petId, startDate, endDate, shareWithFriends=false, calibre, bookingType, friendJobRate } = req.body||{}
    if(!ownerEmail || !petId || !startDate || !endDate) {
      return reply.code(400).send({error:'Missing required fields'})
    }
    
    const days = daysBetween(startDate, endDate)
    const request = await repo.createBookingRequest({
      ownerEmail, petId, startDate, endDate, days, shareWithFriends, calibre, bookingType, friendJobRate, status:'PENDING'
    })
    
    return { bookingRequest: request }
  })

  app.get('/pawtimate/sitters', async (req, reply)=>{
    const { startDate, endDate, calibre, postcode } = req.query||{}
    
    let sitters = await repo.getAllSitters()
    
    sitters = sitters.filter(s => !s.suspended)
    
    if(calibre && calibre !== 'ANY') {
      sitters = sitters.filter(s => s.tier === calibre)
    }
    
    if(postcode) {
      sitters = sitters.filter(s => s.postcode?.startsWith(postcode.split(' ')[0]))
    }
    
    sitters = sitters.map(s => ({
      ...s,
      score: calculateSitterScore(s, startDate, endDate)
    }))
    
    sitters.sort((a, b) => b.score - a.score)
    
    return { sitters, count: sitters.length }
  })

  app.post('/pawtimate/auto-book', async (req, reply)=>{
    const { bookingRequestId, paymentMethod='card', postcode } = req.body||{}
    if(!bookingRequestId) {
      return reply.code(400).send({error:'Missing booking request ID'})
    }
    
    const request = await repo.getBookingRequest(bookingRequestId)
    if(!request) return reply.code(404).send({error:'Booking request not found'})
    
    let sitters = await repo.getAllSitters()
    
    sitters = sitters.filter(s => !s.suspended)
    
    if(request.calibre && request.calibre !== 'ANY') {
      sitters = sitters.filter(s => s.tier === request.calibre)
    }
    
    if(postcode) {
      sitters = sitters.filter(s => s.postcode?.startsWith(postcode.split(' ')[0]))
    }
    
    sitters = await Promise.all(sitters.map(async s => {
      const hasPaw = await repo.hasOwnerPawedSitter(request.ownerEmail, s.id)
      return {
        ...s,
        score: calculateSitterScore(s, request.startDate, request.endDate, hasPaw),
        hasPreviousPaw: hasPaw
      }
    }))
    
    sitters.sort((a, b) => b.score - a.score)
    
    if(sitters.length === 0) {
      return reply.code(404).send({error:'No available companions found for your criteria'})
    }
    
    const bestSitter = sitters[0]
    const total = request.days * bestSitter.ratePerDay
    
    let booking
    try {
      booking = await repo.createBooking({
        ownerEmail: request.ownerEmail,
        sitterKind: 'PRO',
        sitterId: bestSitter.id,
        sitterName: bestSitter.name,
        petId: request.petId,
        startDate: request.startDate,
        endDate: request.endDate,
        ratePerDay: bestSitter.ratePerDay,
        total,
        paymentMethod,
        status:'CONFIRMED',
        escrowId: 'pi_demo_'+nid()
      })
    } catch(err) {
      if(err.message.includes('suspended')) {
        return reply.code(403).send({error:'This companion is currently suspended and unavailable for bookings'})
      }
      throw err
    }
    
    const paymentMessages = {
      card: 'Payment held in escrow until service completion.',
      klarna: 'Pay in 4 interest-free installments with Klarna. Payment held until service completion.',
      affirm: 'Flexible monthly payments with Affirm. Payment held until service completion.'
    }
    
    return { 
      booking,
      companion: bestSitter,
      matchReason: `Automatically matched with ${bestSitter.name} (score: ${bestSitter.score}) - our best available companion for your dates`,
      escrow: { id: booking.escrowId, clientSecret: 'cs_demo_'+nid(), paymentMethod },
      message: `Booking confirmed! ${paymentMessages[paymentMethod] || paymentMessages.card}`
    }
  })

  app.post('/pawtimate/book', async (req, reply)=>{
    const { bookingRequestId, sitterId, paymentMethod='card' } = req.body||{}
    if(!bookingRequestId || !sitterId) {
      return reply.code(400).send({error:'Missing required fields'})
    }
    
    const request = await repo.getBookingRequest(bookingRequestId)
    if(!request) return reply.code(404).send({error:'Booking request not found'})
    
    const sitter = await repo.getSitterById(sitterId)
    if(!sitter) return reply.code(404).send({error:'Sitter not found'})
    
    if(sitter.suspended) {
      return reply.code(403).send({error:'This companion is currently suspended and unavailable for bookings'})
    }
    
    const total = request.days * sitter.ratePerDay
    
    let booking
    try {
      booking = await repo.createBooking({
        ownerEmail: request.ownerEmail,
        sitterKind: 'PRO',
        sitterId,
        sitterName: sitter.name,
        petId: request.petId,
        startDate: request.startDate,
        endDate: request.endDate,
        ratePerDay: sitter.ratePerDay,
        total,
        paymentMethod,
        status:'CONFIRMED',
        escrowId: 'pi_demo_'+nid()
      })
    } catch(err) {
      if(err.message.includes('suspended')) {
        return reply.code(403).send({error:'This companion is currently suspended and unavailable for bookings'})
      }
      throw err
    }
    
    const paymentMessages = {
      card: 'Payment held in escrow until service completion.',
      klarna: 'Pay in 4 interest-free installments with Klarna. Payment held until service completion.',
      affirm: 'Flexible monthly payments with Affirm. Payment held until service completion.'
    }
    
    return { 
      booking,
      escrow: { id: booking.escrowId, clientSecret: 'cs_demo_'+nid(), paymentMethod },
      message: `Booking confirmed! ${paymentMessages[paymentMethod] || paymentMessages.card}`
    }
  })

  app.get('/availability/:userId', async (req, reply)=>{
    const { userId } = req.params
    const dates = await repo.getAvailability(userId)
    return { userId, availability: dates }
  })

  app.put('/availability/:userId', async (req, reply)=>{
    const { userId } = req.params
    const { dates } = req.body || {}
    const updated = await repo.setAvailability(userId, dates || [])
    return { userId, availability: updated }
  })
}

function calculateSitterScore(sitter, startDate, endDate, hasPreviousPaw = false){
  let score = 0
  
  if(hasPreviousPaw) {
    score += 500
  }
  
  const tierWeights = { PREMIUM: 100, VERIFIED: 70, TRAINEE: 40 }
  score += tierWeights[sitter.tier] || 0
  
  score += (sitter.rating || 0) * 10
  
  score += Math.min((sitter.reputation || 0), 100)
  
  score += Math.min((sitter.totalBookings || 0) * 0.5, 50)
  
  return Math.round(score)
}
