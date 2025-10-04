import { repo } from './repo.js'

export default async function bookingCompletionRoutes(app){
  app.post('/bookings/:id/complete', async (req, reply)=>{
    const { id } = req.params
    const booking = await repo.getBooking(id)
    
    if(!booking){
      return reply.code(404).send({error: 'Booking not found'})
    }
    
    if(booking.status === 'COMPLETED'){
      return reply.code(400).send({error: 'Booking already completed'})
    }
    
    booking.status = 'COMPLETED'
    booking.completedAt = new Date().toISOString()
    
    const milestones = []
    
    if(booking.ownerEmail){
      const ownerMilestone = await repo.checkAndCreateMilestone(booking.ownerEmail, 'OWNER')
      if(ownerMilestone){
        milestones.push({
          type: 'owner',
          userId: booking.ownerEmail,
          milestone: ownerMilestone,
          message: `🎉 Congratulations! You've reached 10 completed bookings. A special thank you package from Andrew & Hector is on its way!`
        })
      }
    }
    
    if(booking.sitterId){
      const companionMilestone = await repo.checkAndCreateMilestone(booking.sitterId, 'COMPANION')
      if(companionMilestone){
        milestones.push({
          type: 'companion',
          userId: booking.sitterId,
          milestone: companionMilestone,
          message: `🎉 Congratulations! You've reached 10 completed bookings. A special thank you package from Andrew & Hector is on its way!`
        })
      }
    }
    
    return {
      booking,
      milestones,
      message: booking.status === 'COMPLETED' ? 'Booking marked as completed' : 'Booking status updated'
    }
  })
  
  app.get('/bookings/:id/status', async (req, reply)=>{
    const { id } = req.params
    const booking = await repo.getBooking(id)
    
    if(!booking){
      return reply.code(404).send({error: 'Booking not found'})
    }
    
    return {
      bookingId: id,
      status: booking.status,
      completedAt: booking.completedAt,
      isCompleted: booking.status === 'COMPLETED'
    }
  })
}
