import { api } from './auth';

async function apiGet(path) {
  const r = await api(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listDogsForClient(clientId) {
  const { dogs } = await apiGet(`/clients/${clientId}/dogs`);
  return dogs;
}
