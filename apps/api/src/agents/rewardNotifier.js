import { repo } from '../repo.js'

export async function checkPendingRewards(){
  const allBookings = await repo.db.bookings || {}
  const uniqueOwners = new Set()
  const uniqueSitters = new Set()
  
  Object.values(allBookings).forEach(b => {
    if(b.status === 'COMPLETED'){
      if(b.ownerEmail) uniqueOwners.add(b.ownerEmail)
      if(b.sitterId) uniqueSitters.add(b.sitterId)
    }
  })
  
  for(const ownerEmail of uniqueOwners){
    await repo.checkAndCreateMilestone(ownerEmail, 'OWNER')
  }
  
  for(const sitterId of uniqueSitters){
    await repo.checkAndCreateMilestone(sitterId, 'COMPANION')
  }
  
  const pending = await repo.getPendingRewards()
  
  if(pending.length > 0){
    console.log('\n🎁 ═══════════════════════════════════════════════════════')
    console.log('   REWARD FULFILLMENT ALERT')
    console.log('═══════════════════════════════════════════════════════')
    console.log(`\n${pending.length} user(s) eligible for thank you packages:\n`)
    
    for(const milestone of pending){
      const address = await repo.getAddress(milestone.userId)
      
      console.log(`👤 User: ${milestone.userId} (${milestone.userType})`)
      console.log(`   📊 Milestone: ${milestone.bookingCount} completed bookings`)
      console.log(`   💰 Revenue Generated: £${milestone.revenueGenerated}`)
      console.log(`   🎁 Reward Value: £${milestone.rewardValue}`)
      console.log(`   📍 Address on File: ${address ? 'YES ✓' : 'NO ✗ - COLLECT ADDRESS'}`)
      console.log(`   ⏰ Achieved: ${new Date(milestone.achievedAt).toLocaleDateString()}`)
      console.log('   ─────────────────────────────────────────────────────')
    }
    
    console.log('\n📦 ACTION REQUIRED:')
    console.log('   1. Visit /admin/rewards/pending to view full details')
    console.log('   2. Send thank you package (max £30) with letter from Andrew & Hector')
    console.log('   3. Mark as sent using POST /admin/rewards/{userId}/mark-sent')
    console.log('\n   OR integrate automated fulfillment service (to be discussed)')
    console.log('═══════════════════════════════════════════════════════\n')
  }
}
