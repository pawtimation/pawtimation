import { repo } from './repo.js'
import { nid } from './utils.js'

export default async function ownersRoutes(app){
  app.post('/owners/:email/pets', async (req, reply)=>{
    const { email } = req.params
    const { name, breed='', age='', notes='', photoUrl='' } = req.body||{}
    if(!name) return reply.code(400).send({ error:'name required' })
    const pet = { id:nid(), ownerEmail: email, name, breed, age, notes, photoUrl }
    repo.db = repo.db || {}
    repo.db.petsByOwner = repo.db.petsByOwner || {}
    repo.db.petsByOwner[email] = repo.db.petsByOwner[email] || []
    repo.db.petsByOwner[email].push(pet)
    return { ok:true, pet }
  })

  app.get('/owners/:email/pets', async (req, reply)=>{
    const { email } = req.params
    const list = (repo.db?.petsByOwner?.[email]) || []
    return { pets:list }
  })
}
