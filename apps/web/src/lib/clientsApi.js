import { clientApi } from './auth';

async function apiGet(path) {
  const r = await clientApi(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body) {
  const r = await clientApi(path, { method: 'POST', body });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPatch(path, body) {
  const r = await clientApi(path, { method: 'PATCH', body });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listClientsByBusiness(businessId) {
  return apiGet(`/clients/list`);
}

export async function getClient(clientId) {
  return apiGet(`/clients/${clientId}`);
}

export async function updateClient(clientId, data) {
  return apiPost(`/clients/${clientId}/update`, data);
}

export async function registerClientUser(data) {
  return apiPost(`/client/register`, data);
}

export async function markClientProfileComplete(clientId) {
  return apiPost(`/clients/${clientId}/complete-profile`, {});
}

export async function listDogsForClient(clientId) {
  const { dogs } = await apiGet(`/clients/${clientId}/dogs`);
  return dogs;
}
