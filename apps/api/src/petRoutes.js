const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const pets = (mem.pets = mem.pets || new Map());

function ensure(ownerId){ if(!pets.has(ownerId)) pets.set(ownerId, []); return pets.get(ownerId); }

export default async function petRoutes(app){
  app.get('/owners/:ownerId/pets', async (req)=>({ pets: ensure(req.params.ownerId) }));

  app.post('/owners/:ownerId/pets', async (req)=> {
    const list = ensure(req.params.ownerId);
    const p = { 
      id: `pet_${Date.now()}`,
      name: 'New pet',
      species: 'Dog',
      breed: '',
      age: '',
      weightKg: '',
      notes: '',
      avatarUrl: '',
      vet: { name:'', phone:'' },
      behaviour: { recall:true, anxious:false, goodWithDogs:true },
      medical: { allergies:'', meds:'' },
      ...req.body
    };
    list.push(p);
    return { ok:true, pet:p };
  });

  app.post('/owners/:ownerId/pets/:petId', async (req)=> {
    const list = ensure(req.params.ownerId);
    const ix = list.findIndex(x=>x.id===req.params.petId);
    if (ix<0) return { error:'not_found' };
    list[ix] = { ...list[ix], ...(req.body||{}) };
    return { ok:true, pet:list[ix] };
  });

  app.delete('/owners/:ownerId/pets/:petId', async (req)=> {
    const list = ensure(req.params.ownerId);
    const ix = list.findIndex(x=>x.id===req.params.petId);
    if (ix>=0) list.splice(ix,1);
    return { ok:true };
  });
}
