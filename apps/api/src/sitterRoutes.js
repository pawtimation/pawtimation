import { repo } from './repo.js'

export default async function sitterRoutes(app){
  app.post('/sitters/:id/profile', async (req, reply)=>{
    const { id } = req.params
    const body = req.body || {}
    const updates = { id }
    if(body.name !== undefined) updates.name = body.name
    if(body.postcode !== undefined) updates.postcode = body.postcode
    if(body.bio !== undefined) updates.bio = body.bio
    if(body.services !== undefined) updates.services = body.services
    if(body.ratePerDay !== undefined) updates.ratePerDay = body.ratePerDay
    const s = await repo.upsertSitter(updates)
    return { sitter: s }
  })

  app.get('/sitters/:id/dashboard', async (req, reply)=>{
    const { id } = req.params
    const s = await repo.getSitterById(id) || { id, name:'New sitter' }
    const agreements = await repo.getSitterAgreements(id)
    const fields = ['name','postcode','bio','services','ratePerDay']
    const complete = fields.filter(f=>s[f] && (Array.isArray(s[f])?s[f].length>0:true)).length
    const completion = Math.round((complete/fields.length)*100)

    const tasks = []
    if(!s.postcode) tasks.push('Add your postcode')
    if(!s.bio) tasks.push('Write a short bio')
    if(!s.services || s.services.length===0) tasks.push('Select at least one service')
    if(!s.ratePerDay) tasks.push('Set your day rate')
    if((agreements||[]).length===0) tasks.push('Sign your sitter agreements')

    return {
      sitter: s,
      completion,
      agreements,
      tasks,
      upcoming: []
    }
  })
}
