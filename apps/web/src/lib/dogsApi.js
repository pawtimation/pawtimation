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
