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
  const r = await api(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function listJobsForClient(clientId) {
  const { jobs } = await apiGet(`/jobs/client/${clientId}`);
  return jobs;
}

export async function listJobsByBusiness(businessId) {
  const { jobs } = await apiGet(`/jobs/business/${businessId}`);
  return jobs;
}

export async function createJob(data) {
  const { job } = await apiPost('/bookings/create', data);
  return job;
}

export async function getJob(id) {
  const { job } = await apiGet(`/jobs/${id}`);
  return job;
}

export async function cancelJobRequest(id) {
  return apiPost('/jobs/cancel', { id });
}

export async function updateJobRequest(id, data) {
  const { job } = await apiPost('/jobs/update', { id, ...data });
  return job;
}

export async function createJobRequest(data) {
  const { job } = await apiPost('/jobs/create', data);
  return job;
}

export async function listPendingJobs() {
  return apiGet('/jobs/pending');
}

export async function approveJob(id) {
  return apiPost('/jobs/approve', { id });
}

export async function declineJob(id) {
  return apiPost('/jobs/decline', { id });
}
