import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getTitoStudioAuthToken } from './titoStudioFirestoreBridge';

const PROJECT_ID = process.env.TITO_STUDIO_PROJECT_ID || 't2-content-studio';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const LOCAL_DIR = path.join(process.cwd(), 'data', 'tenant_erp_state');

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

export async function loadTenantErpState(slug: string): Promise<Record<string, any>> {
  const key = normalizeSlugKey(slug);
  ensureLocalDir();
  const localPath = path.join(LOCAL_DIR, `${key}.json`);
  let localData: Record<string, any> = {};
  if (fs.existsSync(localPath)) {
    try { localData = JSON.parse(fs.readFileSync(localPath, 'utf8')); } catch {}
  }

  try {
    const token = await getTitoStudioAuthToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${FIRESTORE_BASE_URL}/tenant_erp_state/${encodeURIComponent(key)}`, {
      headers,
      signal: AbortSignal.timeout(5000)
    });
    if (res.ok) {
      const doc: any = await res.json();
      const rawJson = doc?.fields?.stateJson?.stringValue;
      if (rawJson) {
        const parsed = JSON.parse(rawJson);
        const merged = { ...localData, ...parsed };
        fs.writeFileSync(localPath, JSON.stringify(merged, null, 2), 'utf8');
        return merged;
      }
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

  try {
    const token = await getTitoStudioAuthToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
    await fetch(`${FIRESTORE_BASE_URL}/tenant_erp_state/${encodeURIComponent(key)}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        fields: {
          slug: { stringValue: key },
          updatedAt: { stringValue: nextState.updatedAt },
          stateJson: { stringValue: JSON.stringify(nextState) }
        }
      }),
      signal: AbortSignal.timeout(6000)
    });
  } catch {}

  return nextState;
}

export async function getTenantPasswordRecord(slug: string): Promise<{ hash: string; salt: string; updatedAt?: string } | null> {
  const state = await loadTenantErpState(slug);
  if (state?.__auth?.hash && state?.__auth?.salt) {
    return state.__auth;
  }
  return null;
}

export async function setTenantPasswordRecord(slug: string, newPassword: string): Promise<void> {
  const { hash, salt } = hashPassword(newPassword);
  await saveTenantErpState(slug, {
    __auth: { hash, salt, updatedAt: new Date().toISOString() }
  });
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
  const studioPortalUrl = `https://t2-studio.onrender.com/?brandId=${encodeURIComponent(input.brandId)}`;
  const agentPortalUrl = `https://khedr-bot-agent.onrender.com/dashboard`;
  const message =
    `🎉 *تم تفعيل وإطلاق منظومة ${input.brandName} بالكامل!*\n\n` +
    `🌐 *رابط المتجر وتطبيق الإدارة:*\n${input.liveAppUrl}\n\n` +
    `🔐 *بيانات دخول الإدارة الموثقة:*\n` +
    `• البريد الإلكتروني: \`${input.adminEmail}\`\n` +
    `• كلمة المرور المؤقتة: \`${input.tempPassword}\`\n` +
    `_(يُنصح بتغيير كلمة المرور فور الدخول من إعدادات النظام)_\n\n` +
    `🎨 *استوديو المحتوى:* ${studioPortalUrl}\n` +
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
