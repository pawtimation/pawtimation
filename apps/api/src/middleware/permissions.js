import { repo } from '../repo.js';

export function requirePermission(permissionKey) {
  return async (req, reply) => {
    const user = req.user;

    if (!user) {
      return reply.code(401).send({ error: 'Unauthenticated' });
    }

    const settings = await repo.getBusinessSettings(user.businessId);
    const defs = settings.permissions.roleDefinitions;

    const role = (user.role || 'staff').toLowerCase();
    const roleDef = defs[role];

    if (!roleDef || !roleDef[permissionKey]) {
      return reply.code(403).send({ error: 'Forbidden: insufficient permissions' });
    }
  };
}
