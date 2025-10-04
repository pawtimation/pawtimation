import { repo } from './repo.js'

const plans = {} // bookingId -> access plan (MVP in-memory)

export default async function accessRoutes(app){
  app.post('/bookings/:id/access-plan', async (req, reply)=>{
    const { id } = req.params
    const { method, windowStart, windowEnd, lockboxCode, notes } = req.body||{}
    if(!method) return reply.code(400).send({ error:'method required' })
    plans[id] = { bookingId:id, method, windowStart, windowEnd, lockboxCode, notes, status:'PENDING' }
    return { ok:true, plan: plans[id] }
  })
  app.get('/bookings/:id/access-plan', async (req, reply)=>{
    const { id } = req.params
    return { plan: plans[id] || null }
  })
  app.post('/bookings/:id/key/confirm', async (req, reply)=>{
    const { id } = req.params
    const { type } = req.body||{} // COLLECT or RETURN
    if(!plans[id]) return reply.code(404).send({ error:'no plan' })
    if(type==='COLLECT') plans[id].status='COLLECTED'
    if(type==='RETURN') plans[id].status='RETURNED'
    return { ok:true, plan: plans[id] }
  })
}
