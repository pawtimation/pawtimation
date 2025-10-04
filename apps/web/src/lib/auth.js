import { API_BASE } from '../config';

export const auth = {
  get token(){ return localStorage.getItem('pt_token') || ''; },
  set token(v){ if (v) localStorage.setItem('pt_token', v); else localStorage.removeItem('pt_token'); },
  get user(){ try { return JSON.parse(localStorage.getItem('pt_user')||'null'); } catch { return null; } },
  set user(v){ if (v) localStorage.setItem('pt_user', JSON.stringify(v)); else localStorage.removeItem('pt_user'); }
};

export async function api(path, opts={}){
  const headers = { 'Content-Type':'application/json', ...(opts.headers||{}) };
  if (auth.token) headers.Authorization = `Bearer ${auth.token}`;
  const r = await fetch(`${API_BASE}${path}`, { credentials:'include', ...opts, headers });
  return r;
}
