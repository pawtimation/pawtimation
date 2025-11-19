import { repo } from '../repo.js';
import { requirePermission } from '../middleware/permissions.js';

export default async function automationRoutes(app) {
  // GET automation settings
  app.get('/business/:businessId/automation', async (req, reply) => {
    const settings = await repo.getBusinessSettings(req.params.businessId);
    return settings.automation || {};
  });

  // UPDATE automation settings
  app.put('/business/:businessId/automation', async (req, reply) => {
    const { businessId } = req.params;
    const patch = req.body.automation;

    const currentSettings = await repo.getBusinessSettings(businessId);
    await repo.updateBusinessSettings(businessId, {
      automation: {
        ...currentSettings.automation,
        ...patch
      }
    });

    const updated = await repo.getBusinessSettings(businessId);
    return updated.automation;
  });
}
