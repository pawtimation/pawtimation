import { adminApi } from './auth';

async function apiGet(path) {
  const r = await adminApi(path);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listInvoicesByClient(clientId) {
  const { invoices } = await apiGet(`/client/${clientId}/invoices`);
  return invoices;
}
