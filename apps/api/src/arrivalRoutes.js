import { repo } from './repo.js'
import { isoNow } from './utils.js'

function roundCoord(n){ return Math.round(n*1000)/1000 }

export default async function arrivalRoutes(app){
  app.get('/bookings/:id/attendance', async (req, reply)=>{
    const b = await repo.getBooking(req.params.id)
    if(!b) return reply.code(404).send({error:'Booking not found'})
    return {
      bookingId: b.id,
      checkin: b.checkin || null,
      checkout: b.checkout || null,
      durationMinutes: b.checkin && b.checkout ? Math.max(0, Math.round((new Date(b.checkout.ts)-new Date(b.checkin.ts))/60000)) : null
    }
  })

  app.post('/bookings/:id/checkin', async (req, reply)=>{
    const { lat, lng } = req.body||{}
    const b = await repo.getBooking(req.params.id)
    if(!b) return reply.code(404).send({error:'Booking not found'})
    b.checkin = { ts: isoNow(), lat: roundCoord(lat), lng: roundCoord(lng) }
    await repo.addUpdate(b.id, { type:'CHECKIN', text:`Arrived at property`, aiDiary:`Arrival recorded at ${b.checkin.ts}`, ts: isoNow() })
    return { ok:true, checkin: b.checkin }
  })

  app.post('/bookings/:id/checkout', async (req, reply)=>{
    const { lat, lng } = req.body||{}
    const b = await repo.getBooking(req.params.id)
    if(!b) return reply.code(404).send({error:'Booking not found'})
    b.checkout = { ts: isoNow(), lat: roundCoord(lat), lng: roundCoord(lng) }
    const mins = b.checkin ? Math.max(0, Math.round((new Date(b.checkout.ts)-new Date(b.checkin.ts))/60000)) : null
    await repo.addUpdate(b.id, { type:'CHECKOUT', text:`Departed. Duration: ${mins??'—'} min`, aiDiary:`Departure recorded at ${b.checkout.ts}`, ts: isoNow() })
    return { ok:true, checkout: b.checkout, durationMinutes: mins }
  })
}
