const mem = (globalThis.__PT_MEM__ = globalThis.__PT_MEM__ || {});
const sitters = (mem.sitters = mem.sitters || new Map());

function ensure(id) {
  if (!sitters.has(id)) {
    sitters.set(id, {
      id,
      name: 'Becci',
      city: 'Aylesbury',
      postcode: 'HP20',
      bio: 'Friendly, reliable and fully insured. I love countryside walks and calm, positive training.',
      avatarUrl: 'https://placehold.co/256x256?text=Becci',
      bannerUrl: 'https://placehold.co/1200x400?text=Pawtimation',
      yearsExperience: 2,
      verification: { email: true, sms: true, stripe: true, trainee: false, pro: true },
      services: [
        { key: 'daycare', label: 'Doggy Day Care', price: 45, per: 'day', extraPet: 5, at: 'sitter' },
        { key: 'walk', label: 'Dog Walking', price: 25, per: 'walk', extraPet: 10, at: 'owner' },
        { key: 'homevisit', label: 'One home visit a day', price: 25, per: 'day', at: 'owner' }
      ],
      canAccept: { puppies: true, ages: 'All ages', sizes: 'All sizes' },
      cancellation: { type: 'moderate', copy: 'Full refund if you cancel before 12:00pm, 7 days prior.' },
      availability: { updatedAt: Date.now(), unavailable: ['2025-10-21'] },
      gallery: [],
      rating: 4.9,
      reviews: 12,
      social: {
        instagram: { handle: '@becci.dogs', connected: false, autoPost: false },
        tiktok:    { handle: '@becci.dogs', connected: false, autoPost: false },
        x:         { handle: '@becci_dogs',  connected: false, autoPost: false }
      }
    });
  }
  return sitters.get(id);
}

export default async function sitterRoutes(app) {
  app.get('/sitters', async () => {
    const list = [...sitters.values()].map(s => ({
      id: s.id, name: s.name, city: s.city, avatarUrl: s.avatarUrl, rating: s.rating, reviews: s.reviews
    }));
    return { sitters: list };
  });

  app.get('/sitters/:id', async (req, reply) => {
    const s = ensure(req.params.id);
    return { sitter: s };
  });

  app.post('/sitters/:id', async (req) => {
    const s = ensure(req.params.id);
    const body = req.body || {};
    Object.assign(s, body);
    if (body.availability) s.availability = { ...(s.availability||{}), ...body.availability };
    return { ok: true, sitter: s };
  });

  app.post('/sitters/:id/avatar', async (req) => {
    const s = ensure(req.params.id);
    s.avatarUrl = (req.body && req.body.url) || s.avatarUrl;
    return { ok: true, url: s.avatarUrl };
  });

  app.post('/sitters/:id/banner', async (req) => {
    const s = ensure(req.params.id);
    s.bannerUrl = (req.body && req.body.url) || s.bannerUrl;
    return { ok: true, url: s.bannerUrl };
  });

  app.post('/sitters/:id/gallery', async (req) => {
    const s = ensure(req.params.id);
    const url = (req.body && req.body.url) || '';
    if (url) s.gallery.push({ url });
    return { ok: true, gallery: s.gallery };
  });

  app.get('/sitters/:id/social', async (req) => {
    const s = ensure(req.params.id);
    return { social: s.social || {} };
  });

  app.post('/sitters/:id/social', async (req) => {
    const s = ensure(req.params.id);
    const { network, handle, connected, autoPost } = req.body || {};
    if (!s.social) s.social = {};
    s.social[network] = { ...(s.social[network]||{}), handle, connected: !!connected, autoPost: !!autoPost };
    return { ok: true, social: s.social };
  });
}
