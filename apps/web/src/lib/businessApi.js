import { api, auth } from './auth';

export async function fetchBusinessSettings(businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch business settings');
  }
  return response.json();
}

export async function saveBusinessSettings(settingsPatch, businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsPatch)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save business settings');
  }
  return response.json();
}

export async function fetchAdminBusinesses(search = '') {
  const response = await api(`/admin/businesses${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }
  return response.json();
}
