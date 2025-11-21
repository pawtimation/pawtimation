import { api, auth } from './auth';

export async function listServices(businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
}

export async function addService(service, businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services`, {
    method: 'POST',
    body: JSON.stringify({ service })
  });
  
  if (!response.ok) {
    throw new Error('Failed to add service');
  }
  return response.json();
}

export async function updateService(id, patch, businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ service: patch })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update service');
  }
  return response.json();
}

export async function deleteService(id, businessIdOverride = null) {
  const businessId = businessIdOverride || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services/${id}`, {
    method: 'DELETE'
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete service');
  }
  return response.json();
}

// Aliases for compatibility
export const listBusinessServices = listServices;
export const listServicesByBusiness = listServices;
