const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const sitters = (mem.sitters = mem.sitters || new Map());

// Seed demo companion
if (!sitters.has('s_demo_companion')) {
  sitters.set('s_demo_companion', {
    id:'s_demo_companion',
    name:'Astral',
    city:'London',
    bio:'Kiwi in London helping out paw friends! Calm, patient, and reliable.',
    avatarUrl:'https://placehold.co/256x256?text=Astral',
    bannerUrl:'https://placehold.co/1200x400?text=Banner',
    yearsExperience:1,
    verification:{ email:true, sms:true, stripe:true, trainee:false, pro:true },
    services:[
      { key:'daycare', label:'Doggy Day Care', price:45, per:'day', extraPet:5, at:'sitter' },
      { key:'walk', label:'Dog Walking', price:25, per:'walk', extraPet:10, at:'owner' },
      { key:'homevisit', label:'One home visit a day', price:25, per:'day', at:'owner' }
    ],
    canAccept:{ puppies:true, ages:'All ages', sizes:'All sizes' },
    cancellation:{ type:'moderate', copy:'Full refund if you cancel before 12:00pm, 7 days prior.' },
    availability:{ updatedAt: Date.now(), unavailable:['2025-10-21'] },
    gallery:[],
    rating:4.9, reviews:12
  });
}

function ensure(id) {
  if (!sitters.has(id)) {
    sitters.set(id, {
      id,
      name: 'New Companion',
      city: 'Aylesbury',
      bio: 'I love dogs and long countryside walks.',
      avatarUrl: '',
      bannerUrl: '',
      yearsExperience: 0,
      verification: { email: true, sms: false, stripe: false, trainee: true, pro: false },
      services: [
        { key: 'daycare', label: 'Doggy Day Care', price: 45, per: 'day', extraPet: 5, at: 'sitter' },
        { key: 'walk', label: 'Dog Walking', price: 25, per: 'walk', extraPet: 10, at: 'owner' },
        { key: 'homevisit', label: 'One home visit a day', price: 25, per: 'day', at: 'owner' }
      ],
      canAccept: { puppies: true, ages: 'All ages', sizes: 'All sizes' },
      cancellation: { type: 'moderate', copy: 'Full refund if you cancel before 12:00pm, 7 days prior.' },
      availability: {
        updatedAt: Date.now(),
        unavailable: []
      },
      gallery: [],
      rating: 4.9,
      reviews: 12
    });
  }
  return sitters.get(id);
}

export default async function sitterRoutes(app) {
  app.get('/sitters', async () => {
    return { sitters: [...sitters.values()].map(s => ({ id: s.id, name: s.name, city: s.city, avatarUrl: s.avatarUrl, rating: s.rating, reviews: s.reviews })) };
  });

  app.get('/sitters/:id', async (req) => {
    const s = ensure(req.params.id);
    return { sitter: s };
  });

  app.post('/sitters/:id', async (req, reply) => {
    const s = ensure(req.params.id);
    Object.assign(s, req.body || {});
    s.availability = { ...(s.availability||{}), ...(req.body?.availability||{}) };
    return { ok: true, sitter: s };
  });

  app.post('/sitters/:id/avatar', async (req) => {
    const s = ensure(req.params.id);
    const { url='' } = req.body||{};
    s.avatarUrl = url;
    return { ok:true, url };
  });
  app.post('/sitters/:id/banner', async (req) => {
    const s = ensure(req.params.id);
    const { url='' } = req.body||{};
    s.bannerUrl = url;
    return { ok:true, url };
  });
  app.post('/sitters/:id/gallery', async (req) => {
    const s = ensure(req.params.id);
    const { url='' } = req.body||{};
    if (url) s.gallery.push({ url });
    return { ok:true, gallery: s.gallery };
  });

  app.post('/sitters/:id/verify', async (req) => {
    const s = ensure(req.params.id);
    const { pro=false } = req.body||{};
    s.verification.pro = !!pro;
    s.verification.trainee = !pro;
    return { ok:true, sitter: s };
  });

  // Legacy dashboard route for compatibility
  app.get('/sitters/:id/dashboard', async (req, reply) => {
    const s = ensure(req.params.id);
    const fields = ['name','city','bio','services'];
    const complete = fields.filter(f => s[f] && (Array.isArray(s[f]) ? s[f].length>0 : true)).length;
    const completion = Math.round((complete/fields.length)*100);
    return { sitter:s, completion, agreements:[], tasks:[], upcoming:[] };
  });
}
