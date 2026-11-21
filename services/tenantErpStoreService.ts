import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getTitoStudioAuthToken } from './titoStudioFirestoreBridge';

const PROJECT_ID = process.env.TITO_STUDIO_PROJECT_ID || 't2-content-studio';
const FIRESTORE_SETTINGS_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/agency_settings`;
const LOCAL_DIR = path.join(process.cwd(), 'data', 'tenant_erp_state');

const SHARD_KEYS = {
  catalog: ['products', 'broadcasts', 'discountCodes', 'storefrontSettings', 'settings', 'counters', 'appCustomization'] as const,
  orders: ['orders', 'notifications'] as const,
  sales: ['dailySales', 'treasury', 'expenses', 'dailyReview'] as const,
  ops: [
    'employees',
    'advances',
    'attendance',
    'payroll',
    'suppliers',
    'purchaseOrders',
    'payments',
    'stockTransfers',
    'users',
  ] as const,
};

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

export function normalizeSlugKey(slug: string): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'default';
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, s, 64).toString('hex');
  return { hash, salt: s };
}

export function verifyPasswordHash(password: string, hash: string, salt: string): boolean {
  try {
    const derived = crypto.scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, 'hex');
    return derived.length === stored.length && crypto.timingSafeEqual(derived, stored);
  } catch {
    return false;
  }
}

async function readShardDoc(docId: string): Promise<Record<string, any> | null> {
  try {
    const token = await getTitoStudioAuthToken().catch(() => null);
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${FIRESTORE_SETTINGS_URL}/${encodeURIComponent(docId)}`, {
      headers,
      signal: AbortSignal.timeout(5000)
    });
    if (!res.ok) return null;
    const doc: any = await res.json();
    const rawJson = doc?.fields?.stateJson?.stringValue;
    if (!rawJson) return null;
    const parsed = JSON.parse(rawJson);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

async function writeShardDoc(docId: string, key: string, shard: string, data: Record<string, any>): Promise<void> {
  try {
    const token = await getTitoStudioAuthToken().catch(() => null);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    await fetch(`${FIRESTORE_SETTINGS_URL}/${encodeURIComponent(docId)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          slug: { stringValue: key },
          shard: { stringValue: shard },
          updatedAt: { stringValue: new Date().toISOString() },
          stateJson: { stringValue: JSON.stringify(data) }
        }
      }),
      signal: AbortSignal.timeout(6000)
    });
  } catch {}
}

function pickShardKeys(source: Record<string, any>, keys: readonly string[]): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of keys) {
    if (k in source && source[k] !== undefined) out[k] = source[k];
  }
  return out;
}

export async function loadTenantErpState(slug: string): Promise<Record<string, any>> {
  const key = normalizeSlugKey(slug);
  ensureLocalDir();
  const localPath = path.join(LOCAL_DIR, `${key}.json`);
  let localData: Record<string, any> = {};
  if (fs.existsSync(localPath)) {
    try { localData = JSON.parse(fs.readFileSync(localPath, 'utf8')); } catch {}
  }

  try {
    const [catalog, orders, sales, ops, authRec] = await Promise.all([
      readShardDoc(`t2_erp_${key}__catalog`),
      readShardDoc(`t2_erp_${key}__orders`),
      readShardDoc(`t2_erp_${key}__sales`),
      readShardDoc(`t2_erp_${key}__ops`),
      readShardDoc(`t2_erp_${key}__auth`),
    ]);

    if (catalog || orders || sales || ops || authRec) {
      const merged: Record<string, any> = {
        ...localData,
        ...(catalog || {}),
        ...(orders || {}),
        ...(sales || {}),
        ...(ops || {}),
        ...(authRec ? { __auth: authRec } : {}),
      };
      try {
        fs.writeFileSync(localPath, JSON.stringify(merged, null, 2), 'utf8');
      } catch {}
      return merged;
    }
  } catch {}

  return localData;
}

export async function saveTenantErpState(slug: string, partialState: Record<string, any>): Promise<Record<string, any>> {
  const key = normalizeSlugKey(slug);
  ensureLocalDir();
  const localPath = path.join(LOCAL_DIR, `${key}.json`);
  const existing = await loadTenantErpState(key);
  const nextState = {
    ...existing,
    ...partialState,
    updatedAt: new Date().toISOString()
  };

  try {
    fs.writeFileSync(localPath, JSON.stringify(nextState, null, 2), 'utf8');
  } catch {}

  const writes: Promise<void>[] = [];
  for (const [shardName, shardKeyList] of Object.entries(SHARD_KEYS) as Array<[keyof typeof SHARD_KEYS, readonly string[]]>) {
    const incomingForShard = pickShardKeys(partialState, shardKeyList);
    if (Object.keys(incomingForShard).length > 0) {
      const mergedShard = {
        ...pickShardKeys(existing, shardKeyList),
        ...incomingForShard,
      };
      writes.push(writeShardDoc(`t2_erp_${key}__${shardName}`, key, shardName, mergedShard));
    }
  }
  if (partialState.__auth && typeof partialState.__auth === 'object') {
    writes.push(writeShardDoc(`t2_erp_${key}__auth`, key, 'auth', partialState.__auth));
  }

  if (writes.length > 0) {
    await Promise.all(writes);
  }

  return nextState;
}

export async function getTenantPasswordRecord(slug: string): Promise<{ hash: string; salt: string; updatedAt?: string } | null> {
  const key = normalizeSlugKey(slug);
  const remoteAuth = await readShardDoc(`t2_erp_${key}__auth`);
  if (remoteAuth?.hash && remoteAuth?.salt) {
    return remoteAuth as { hash: string; salt: string; updatedAt?: string };
  }
  const state = await loadTenantErpState(slug);
  if (state?.__auth?.hash && state?.__auth?.salt) {
    return state.__auth;
  }
  return null;
}

export async function setTenantPasswordRecord(slug: string, newPassword: string): Promise<void> {
  const key = normalizeSlugKey(slug);
  const { hash, salt } = hashPassword(newPassword);
  const authRec = { hash, salt, updatedAt: new Date().toISOString() };
  await writeShardDoc(`t2_erp_${key}__auth`, key, 'auth', authRec);
  await saveTenantErpState(slug, { __auth: authRec });
}

export async function sendZeroTouchOnboardingPacket(input: {
  brandId: string;
  slug: string;
  brandName: string;
  phone?: string;
  liveAppUrl: string;
  adminEmail: string;
  tempPassword: string;
}): Promise<{ whatsappSent: boolean; telegramSent: boolean }> {
  const { signClientPortalToken } = await import('../routes/tenantErpRoutes');
  const portalToken = signClientPortalToken(input.brandId);
  const studioPortalUrl = `${(process.env.TITO_STUDIO_PUBLIC_URL || 'https://t2-studio.vercel.app').replace(/\/$/, '')}/?view=clientPortal&brandId=${encodeURIComponent(input.brandId)}&embed=1`;
  const agentPortalUrl = `https://agent.t2os.app/embed/crm?brandId=${encodeURIComponent(input.brandId)}&embed=1`;
  const unifiedPortalUrl = `https://t2os.app/client/${encodeURIComponent(input.brandId)}?token=${encodeURIComponent(portalToken)}`;
  const message =
    `🎉 *تم تفعيل وإطلاق منظومة ${input.brandName} بالكامل!*\n\n` +
    `🧭 *بوابة العميل الموحدة (الشوروم + الأيجنت + مدير الحساب):*\n${unifiedPortalUrl}\n\n` +
    `🌐 *رابط المتجر وتطبيق الإدارة:*\n${input.liveAppUrl}\n\n` +
    `🔐 *بيانات دخول الإدارة الموثقة:*\n` +
    `• البريد الإلكتروني: \`${input.adminEmail}\`\n` +
    `• كلمة المرور المؤقتة: \`${input.tempPassword}\`\n` +
    `_(يُنصح بتغيير كلمة المرور فور الدخول من إعدادات النظام)_\n\n` +
    `🎨 *صالة العرض والاعتماد (Showroom):* ${studioPortalUrl}\n` +
    `🤖 *لوحة الوكيل الذكي:* ${agentPortalUrl}`;

  let whatsappSent = false;
  let telegramSent = false;

  try {
    const { titoStudioApi } = await import('./titoStudioApiClient');
    const { t2AgentApi } = await import('./t2AgentApiClient');
    if (input.phone && typeof (t2AgentApi as any)?.sendManualReply === 'function') {
      await t2AgentApi.sendManualReply(input.brandId, input.phone, message)
        .then(() => { whatsappSent = true; })
        .catch(() => {});
    }
    await titoStudioApi.sendAlertTest(input.brandId, message, 'onboarding')
      .then(() => { telegramSent = true; })
      .catch(() => {});
  } catch {}

  return { whatsappSent, telegramSent };
}
