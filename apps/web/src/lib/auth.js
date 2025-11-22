import { API_BASE } from '../config';

const SESSION_KEYS = {
  ADMIN: 'pawtimation_admin_session',
  STAFF: 'pawtimation_staff_session',
  CLIENT: 'pawtimation_client_session'
};

const LEGACY_KEYS = ['pt_token', 'pt_user', 'pt_client'];

function normalizeRole(role) {
  if (!role) return null;
  const r = role.toUpperCase();
  if (r === 'ADMIN') return 'ADMIN';
  if (r === 'STAFF') return 'STAFF';
  if (r === 'CLIENT') return 'CLIENT';
  return null;
}

function getSessionKey(role) {
  const normalized = normalizeRole(role);
  return SESSION_KEYS[normalized] || null;
}

export function setSession(role, { token, user, expiry }) {
  const key = getSessionKey(role);
  if (!key) {
    console.error(`Invalid role for session: ${role}`);
    return false;
  }

  const sessionData = {
    token,
    role: normalizeRole(role),
    businessId: user?.businessId || null,
    userId: user?.id || null,
    email: user?.email || null,
    name: user?.name || null,
    isAdmin: user?.isAdmin || false,
    crmClientId: user?.crmClientId || null,
    expiry: expiry || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    userSnapshot: user
  };

  try {
    localStorage.setItem(key, JSON.stringify(sessionData));
    return true;
  } catch (error) {
    console.error('Failed to set session:', error);
    return false;
  }
}

export function getSession(role) {
  const key = getSessionKey(role);
  if (!key) return null;

  const raw = localStorage.getItem(key);
  if (!raw) {
    migrateLegacySession(role);
    const migratedRaw = localStorage.getItem(key);
    if (!migratedRaw) return null;
    return parseSession(migratedRaw, key);
  }

  return parseSession(raw, key);
}

function parseSession(raw, key) {
  try {
    const session = JSON.parse(raw);
    
    if (!session.token || !session.role) {
      localStorage.removeItem(key);
      return null;
    }

    if (session.expiry && new Date(session.expiry) < new Date()) {
      localStorage.removeItem(key);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Failed to parse session:', error);
    localStorage.removeItem(key);
    return null;
  }
}

function migrateLegacySession(role) {
  const legacyToken = localStorage.getItem('pt_token');
  const legacyUser = localStorage.getItem('pt_user');
  
  if (!legacyToken || !legacyUser) return false;

  try {
    const user = JSON.parse(legacyUser);
    const userRole = normalizeRole(user.role || (user.isAdmin ? 'ADMIN' : null));
    
    if (userRole && userRole === normalizeRole(role)) {
      const key = getSessionKey(role);
      if (!key) return false;
      
      const sessionData = {
        token: legacyToken,
        role: userRole,
        businessId: user?.businessId || null,
        userId: user?.id || null,
        email: user?.email || null,
        name: user?.name || null,
        isAdmin: user?.isAdmin || false,
        crmClientId: user?.crmClientId || null,
        expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        userSnapshot: user
      };
      
      localStorage.setItem(key, JSON.stringify(sessionData));
      // Keep legacy keys for backwards compatibility
      return true;
    }
  } catch (error) {
    console.error('Legacy migration failed:', error);
  }
  
  return false;
}

export function clearSession(role) {
  const key = getSessionKey(role);
  if (key) {
    localStorage.removeItem(key);
    return true;
  }
  return false;
}

export function clearAllSessions() {
  Object.values(SESSION_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  clearLegacySessions();
}

export function getAuthHeader(role) {
  const session = getSession(role);
  return session?.token ? `Bearer ${session.token}` : null;
}

export const auth = {
  get token() {
    console.warn('auth.token is deprecated. Use getSession(role) instead.');
    const adminSession = getSession('ADMIN');
    const staffSession = getSession('STAFF');
    const clientSession = getSession('CLIENT');
    return adminSession?.token || staffSession?.token || clientSession?.token || '';
  },
  set token(v) {
    console.warn('Direct token setter is deprecated. Use setSession() instead.');
  },
  get user() {
    console.warn('auth.user is deprecated. Use getSession(role) instead.');
    const adminSession = getSession('ADMIN');
    const staffSession = getSession('STAFF');
    const clientSession = getSession('CLIENT');
    const session = adminSession || staffSession || clientSession;
    return session?.userSnapshot || null;
  },
  set user(v) {
    console.warn('Direct user setter is deprecated. Use setSession() instead.');
  }
};

export async function api(path, opts = {}) {
  const headers = { ...(opts.headers || {}) };

  if (opts.body) {
    headers['Content-Type'] = 'application/json';
  }

  const role = opts.role || null;
  let authHeader = null;

  if (role) {
    authHeader = getAuthHeader(role);
  } else {
    console.warn(`api() called without role parameter for ${path}. This may cause cross-role token leakage.`);
    if (auth.token) {
      authHeader = `Bearer ${auth.token}`;
    }
  }

  if (authHeader) {
    headers.Authorization = authHeader;
  }

  const requestOpts = { ...opts };
  delete requestOpts.role;

  const r = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...requestOpts,
    headers
  });
  return r;
}

export function createRoleApi(role) {
  return async function(path, opts = {}) {
    return api(path, { ...opts, role });
  };
}

export const adminApi = createRoleApi('ADMIN');
export const staffApi = createRoleApi('STAFF');
export const clientApi = createRoleApi('CLIENT');
