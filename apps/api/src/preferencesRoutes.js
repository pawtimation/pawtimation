import { repo } from './repo.js'

export default async function preferencesRoutes(app){
  app.post('/preferences/paw', async (req, reply)=>{
    const { ownerEmail, sitterId } = req.body||{}
    if(!ownerEmail || !sitterId) {
      return reply.code(400).send({error:'Missing required fields'})
    }
    
    const preference = await repo.setOwnerPreference(ownerEmail, sitterId, { 
      pawed: true,
      reason: 'Owner gave paw rating'
    })
    
    return { 
      success: true,
      preference,
      message: `${sitterId} is now a priority companion for future bookings!`
    }
  })

  app.get('/preferences/:ownerEmail', async (req, reply)=>{
    const { ownerEmail } = req.params
    const preferences = await repo.getOwnerPreferences(ownerEmail)
    
    return { 
      ownerEmail,
      preferences,
      pawedCompanions: Object.keys(preferences).filter(sid => preferences[sid].pawed)
    }
  })
}
