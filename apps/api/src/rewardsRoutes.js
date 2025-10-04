import { repo } from './repo.js'

export default async function rewardsRoutes(app){
  app.get('/admin/rewards/pending', async (req, reply)=>{
    const pending = await repo.getPendingRewards()
    
    const enriched = await Promise.all(pending.map(async (milestone) => {
      const address = await repo.getAddress(milestone.userId)
      let userData = {}
      
      if(milestone.userType === 'OWNER'){
        userData.email = milestone.userId
      } else if(milestone.userType === 'COMPANION'){
        const sitter = await repo.getSitterById(milestone.userId)
        userData.name = sitter?.name
      }
      
      return {
        ...milestone,
        address,
        userData,
        hasAddress: !!address
      }
    }))
    
    return { 
      pending: enriched,
      count: enriched.length,
      totalRewardValue: enriched.reduce((sum, m) => sum + (m.rewardValue || 0), 0)
    }
  })

  app.post('/admin/rewards/:userId/mark-sent', async (req, reply)=>{
    const { userId } = req.params
    const { trackingNumber, carrier, notes } = req.body || {}
    
    const milestone = await repo.getMilestone(userId)
    if(!milestone){
      return reply.code(404).send({error: 'No milestone found for this user'})
    }
    
    if(milestone.rewardSent){
      return reply.code(400).send({error: 'Reward already marked as sent'})
    }
    
    const updated = await repo.markRewardSent(userId, {
      trackingNumber,
      carrier,
      notes,
      manuallyProcessed: true
    })
    
    return { 
      milestone: updated,
      message: `Reward marked as sent for ${userId}. Thank you package should include letter from Andrew & Hector!`
    }
  })

  app.get('/milestones/:userId', async (req, reply)=>{
    const { userId } = req.params
    const milestone = await repo.getMilestone(userId)
    
    if(!milestone){
      const ownerCount = await repo.getBookingCountByOwner(userId)
      const ownerRevenue = await repo.getRevenueByOwner(userId)
      const sitterCount = await repo.getBookingCountBySitter(userId)
      const sitterRevenue = await repo.getRevenueBySitter(userId)
      
      return {
        milestone: null,
        progress: {
          asOwner: { 
            bookingsCompleted: ownerCount, 
            bookingsRemaining: Math.max(0, 10 - ownerCount),
            revenuePounds: (ownerRevenue / 100).toFixed(2),
            revenueRemaining: Math.max(0, 500 - (ownerRevenue / 100)).toFixed(2)
          },
          asCompanion: { 
            bookingsCompleted: sitterCount, 
            bookingsRemaining: Math.max(0, 10 - sitterCount),
            revenuePounds: (sitterRevenue / 100).toFixed(2),
            revenueRemaining: Math.max(0, 500 - (sitterRevenue / 100)).toFixed(2)
          }
        }
      }
    }
    
    return { milestone }
  })

  app.post('/addresses', async (req, reply)=>{
    const { userId, fullName, addressLine1, addressLine2, city, postcode, country='UK' } = req.body || {}
    
    if(!userId || !fullName || !addressLine1 || !city || !postcode){
      return reply.code(400).send({error: 'Missing required address fields'})
    }
    
    const address = await repo.setAddress(userId, {
      fullName,
      addressLine1,
      addressLine2,
      city,
      postcode,
      country
    })
    
    return { address, message: 'Address saved for reward fulfillment' }
  })

  app.get('/addresses/:userId', async (req, reply)=>{
    const { userId } = req.params
    const address = await repo.getAddress(userId)
    
    if(!address){
      return reply.code(404).send({error: 'No address found for this user'})
    }
    
    return { address }
  })
}
