import { api } from './auth';

async function apiGet(path, queryParams = {}, role = 'ADMIN') {
  const query = new URLSearchParams(queryParams).toString();
  const url = query ? `${path}?${query}` : path;
  const r = await api(url, { role });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body, role = 'ADMIN') {
  const r = await api(path, {
    method: 'POST',
    body: JSON.stringify(body),
    role
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function sendMessage(data, role = 'ADMIN') {
  return apiPost('/messages/send', data, role);
}

export function getBookingMessages(businessId, bookingId, role = 'ADMIN') {
  return apiGet('/messages/booking', { businessId, bookingId }, role);
}

export function getInboxMessages(businessId, clientId, role = 'ADMIN') {
  return apiGet('/messages/inbox', { businessId, clientId }, role);
}

export function markBookingRead(businessId, bookingId, role = 'ADMIN') {
  return apiPost('/messages/mark-booking-read', { businessId, bookingId, role }, role);
}

export function markInboxRead(businessId, clientId, role = 'ADMIN') {
  return apiPost('/messages/mark-inbox-read', { businessId, clientId, role }, role);
}
