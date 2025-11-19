import { api, auth } from './auth';

export async function fetchBusinessSettings() {
  if (!auth.user?.businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${auth.user.businessId}/settings`);
  if (!response.ok) {
    throw new Error('Failed to fetch business settings');
  }
  return response.json();
}

export async function saveBusinessSettings(settingsPatch) {
  if (!auth.user?.businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${auth.user.businessId}/settings`, {
    method: 'PUT',
    body: JSON.stringify(settingsPatch)
  });
  
  if (!response.ok) {
    throw new Error('Failed to save business settings');
  }
  return response.json();
}
