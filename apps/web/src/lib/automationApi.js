import { api, auth } from './auth';

export async function fetchAutomationSettings(businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/automation`);
  if (!response.ok) {
    throw new Error('Failed to fetch automation settings');
  }
  return response.json();
}

export async function saveAutomationSettings(patch, businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
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
