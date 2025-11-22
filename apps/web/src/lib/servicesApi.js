import { adminApi, staffApi, clientApi, getSession } from './auth';

function getRoleApi(role) {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN') return adminApi;
  if (normalized === 'STAFF') return staffApi;
  if (normalized === 'CLIENT') return clientApi;
  throw new Error(`Invalid role: ${role}`);
}

export async function listServices(businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
  if (!businessId) {
    throw new Error('No business ID found');
  }
  
  const response = await api(`/business/${businessId}/services`);
  if (!response.ok) {
    throw new Error('Failed to fetch services');
  }
  return response.json();
}

export async function addService(service, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
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

export async function updateService(id, patch, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
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

export async function deleteService(id, businessIdOverride = null, role) {
  if (!role) throw new Error('role parameter required');
  const api = getRoleApi(role);
  const session = getSession(role);
  const businessId = businessIdOverride || session?.businessId;
  
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
