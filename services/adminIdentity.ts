export const MASTER_ADMIN_EMAILS = [
  'ahm.atya@gmail.com',
  'ahmed.atya.daif@gmail.com',
  'admin@shadow.com',
  'tito@shadow.com',
  'tito',
] as const;

export function isMasterAdminEmail(email?: string | null): boolean {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return false;
  return (MASTER_ADMIN_EMAILS as readonly string[]).includes(clean);
}

export async function getAdminAuthHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  const headers: Record<string, string> = { ...(extra || {}) };
  if (typeof window === 'undefined') return headers;

  try {
    const adminToken = localStorage.getItem('t2os_admin_token');
    if (adminToken) {
      headers['Authorization'] = `Bearer ${adminToken}`;
      return headers;
    }
  } catch {}

  try {
    const { getAuth } = await import('firebase/auth');
    const fbUser = getAuth().currentUser;
    if (fbUser) {
      const token = await fbUser.getIdToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}

  return headers;
}
