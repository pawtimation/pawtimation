import { repo } from './repo.js';

export default async function sitterRoutes(app){
  app.post('/sitters/:id/profile', async (req, reply) => {
    const { id } = req.params;
    const { name='New Companion', postcode='HP20', bio='', services=[], ratePerDay=3500 } = req.body||{};
    const sitter = await repo.upsertSitter({
      id, name, postcode, bio, services, ratePerDay,
      tier:'VERIFIED', rating:4.9, reviews:12
    });
    return { sitter };
  });

  app.get('/sitters/:id/dashboard', async (req, reply) => {
    const { id } = req.params;
    const s = await repo.getSitterById(id) || {
      id, name:'New Companion', postcode:'HP20', bio:'',
      services:[], ratePerDay:3500, tier:'VERIFIED', rating:4.9, reviews:12
    };
    const fields = ['name','postcode','bio','services','ratePerDay'];
    const complete = fields.filter(f => s[f] && (Array.isArray(s[f]) ? s[f].length>0 : true)).length;
    const completion = Math.round((complete/fields.length)*100);
    const agreements = (await repo.getSitterAgreements?.(id)) || [];
    return { sitter:s, completion, agreements, tasks:[], upcoming:[] };
  });
}
