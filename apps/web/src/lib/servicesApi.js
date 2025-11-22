import { api, auth, getSession } from './auth';

export async function listServices(businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services`, { role });
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
}

export async function addService(service, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services`, {
    method: 'POST',
    body: JSON.stringify({ service }),
    role
  });
  
  if (!response.ok) {
    throw new Error('Failed to add service');
  }
  return response.json();
}

export async function updateService(id, patch, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ service: patch }),
    role
  });
  
  if (!response.ok) {
    throw new Error('Failed to update service');
  }
  return response.json();
}

export async function deleteService(id, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId || auth.user?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services/${id}`, {
    method: 'DELETE',
    role
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete service');
  }
  return response.json();
}

// Aliases for compatibility
export const listBusinessServices = listServices;
export const listServicesByBusiness = listServices;
