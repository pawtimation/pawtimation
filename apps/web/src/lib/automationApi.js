import { api, auth, getSession } from './auth';

export async function fetchAutomationSettings(businessIdOverride = null, role = 'ADMIN') {
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/automation`, { role });
  if (!response.ok) {
    throw new Error('Failed to fetch automation settings');
  }
  return response.json();
}

export async function saveAutomationSettings(patch, businessIdOverride = null, role = 'ADMIN') {
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/automation`, {
    method: 'PUT',
    body: JSON.stringify({ automation: patch }),
    role
  });
  
  if (!response.ok) {
    throw new Error('Failed to save automation settings');
  }
  return response.json();
}
