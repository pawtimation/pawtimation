export function hasPermission(key, user, businessSettings) {
  if (!user || !businessSettings) return false;
  
  const role = (user.role || 'staff').toLowerCase();
  const defs = businessSettings.permissions?.roleDefinitions;
  
  if (!defs) return false;
  
  return defs[role]?.[key] ?? false;
}

export function getUserRole(user) {
  return (user?.role || 'staff').toLowerCase();
}
