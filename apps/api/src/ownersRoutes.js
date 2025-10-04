import { repo } from './repo.js'
import { nid } from './utils.js'

export default async function ownersRoutes(app){
  // Pet routes moved to petRoutes.js for richer functionality
  
  app.get('/owners/:email/settings', async (req, reply)=>{
    const { email } = req.params
    const owner = await repo.getOwner(email)
    return { 
      email,
      enableFriendJobs: owner?.enableFriendJobs ?? false
    }
  })

  app.patch('/owners/:email/settings', async (req, reply)=>{
    const { email } = req.params
    const { enableFriendJobs } = req.body || {}
    
    if(typeof enableFriendJobs !== 'boolean'){
      return reply.code(400).send({ error: 'enableFriendJobs must be a boolean' })
    }
    
    const updated = await repo.setOwnerFlag(email, 'enableFriendJobs', enableFriendJobs)
    return { ok: true, owner: updated }
  })
}
