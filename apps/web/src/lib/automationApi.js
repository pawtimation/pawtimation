import { adminApi, staffApi, clientApi, getSession } from './auth';

function getRoleApi(role) {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN') return adminApi;
  if (normalized === 'STAFF') return staffApi;
  if (normalized === 'CLIENT') return clientApi;
  throw new Error(`Invalid role: ${role}`);
}

export async function fetchAutomationSettings(businessIdOverride = null, role = 'ADMIN') {
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/automation`);
  if (!response.ok) {
    throw new Error('Failed to fetch automation settings');
  }
  return response.json();
}

export async function saveAutomationSettings(patch, businessIdOverride = null, role = 'ADMIN') {
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/automation`, {
    method: 'PUT',
    body: JSON.stringify({ automation: patch })
  });
  
  if (!response.ok) {
    throw new Error('Failed to save automation settings');
  }
  return response.json();
}
