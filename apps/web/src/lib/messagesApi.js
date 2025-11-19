import { api } from './auth';

async function apiGet(path, queryParams = {}) {
  const query = new URLSearchParams(queryParams).toString();
  const url = query ? `${path}?${query}` : path;
  const r = await api(url);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

async function apiPost(path, body) {
  const r = await api(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function sendMessage(data) {
  return apiPost('/messages/send', data);
}

export function getBookingMessages(businessId, bookingId) {
  return apiGet('/messages/booking', { businessId, bookingId });
}

export function getInboxMessages(businessId, clientId) {
  return apiGet('/messages/inbox', { businessId, clientId });
}

export function markBookingRead(businessId, bookingId, role) {
  return apiPost('/messages/mark-booking-read', { businessId, bookingId, role });
}

export function markInboxRead(businessId, clientId, role) {
  return apiPost('/messages/mark-inbox-read', { businessId, clientId, role });
}
