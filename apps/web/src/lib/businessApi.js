import { getSession, adminApi } from './auth';

export async function fetchBusinessSettings(businessIdOverride = null) {
  const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
  const businessId = businessIdOverride || session?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await adminApi(`/business/${businessId}/settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch business settings');
  }
  return response.json();
}

export async function saveBusinessSettings(settingsPatch, businessIdOverride = null) {
  const session = getSession('ADMIN') || getSession('SUPER_ADMIN');
  const businessId = businessIdOverride || session?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await adminApi(`/business/${businessId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsPatch)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save business settings');
  }
  
  const result = await response.json();
  
  if (settingsPatch.profile?.businessName) {
    window.dispatchEvent(new CustomEvent('businessNameUpdated'));
  }
  
  return result;
}

export async function fetchAdminBusinesses(search = '') {
  const response = await adminApi(`/admin/businesses${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  if (!response.ok) {
    throw new Error('Failed to fetch businesses');
  }
  return response.json();
}

export async function getBusiness(businessId) {
  const response = await adminApi(`/business/${businessId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch business');
  }
  return response.json();
}
