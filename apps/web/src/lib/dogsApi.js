import { adminApi, staffApi, clientApi } from './auth';

function getRoleApi(role) {
  const normalized = role?.toUpperCase();
  if (normalized === 'ADMIN') return adminApi;
  if (normalized === 'STAFF') return staffApi;
  if (normalized === 'CLIENT') return clientApi;
  throw new Error(`Invalid role: ${role}`);
}

async function apiGet(path, role = 'ADMIN') {
  const api = getRoleApi(role);
  const r = await api(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body, role = 'ADMIN') {
  const api = getRoleApi(role);
  const r = await api(path, { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPatch(path, body, role = 'ADMIN') {
  const api = getRoleApi(role);
  const r = await api(path, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listDogsByBusiness(businessId) {
  const { dogs } = await apiGet(`/dogs?businessId=${businessId}`);
  return dogs;
}

export async function listDogsByClient(clientId) {
  return apiGet(`/dogs/by-client/${clientId}`);
}

export async function createDog(data) {
  const { dog } = await apiPost(`/dogs`, data);
  return dog;
}

export async function updateDog(dogId, data) {
  return apiPatch(`/dogs/${dogId}`, data);
}
