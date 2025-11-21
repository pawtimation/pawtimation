import { api } from './auth';

async function apiGet(path) {
  const r = await api(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body) {
  const r = await api(path, { method: 'POST', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPatch(path, body) {
  const r = await api(path, { method: 'PATCH', body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
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
