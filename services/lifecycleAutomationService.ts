import { readPersistentJson, savePersistentJson } from './persistentStorage';
import { readPaymobSubscriptions, isSubscriptionActiveNow } from './paymobService';
import { upsertBrandRegistryEntry } from './brandRegistryService';
import { t2AgentApi } from './t2AgentApiClient';

export interface LifecycleSweepEvent {
  key: string;
  brandId: string;
  kind: 'reminder_48h' | 'expired_enforced' | 'token_expiry_alert';
  message: string;
  createdAt: string;
}

export interface SocialTokenAlert {
  brandId: string;
  brandName: string;
  platform: 'meta' | 'tiktok' | 'youtube' | 'social';
  reason: string;
  expiresAt?: string;
}

const EVENTS_DOC_KEY = 't2_lifecycle_events';
const EVENTS_FILE = 't2_lifecycle_events.json';

function loadLifecycleEvents(): LifecycleSweepEvent[] {
  const raw = readPersistentJson<LifecycleSweepEvent[]>(EVENTS_FILE, []);
  return Array.isArray(raw) ? raw : [];
}

function saveLifecycleEvents(events: LifecycleSweepEvent[]): void {
  savePersistentJson(EVENTS_DOC_KEY, EVENTS_FILE, events.slice(-1000));
}

export async function runLifecycleAndTokenSweep(options?: {
  dryRun?: boolean;
  notifier?: (phone: string, message: string) => Promise<void>;
}): Promise<{
  dryRun: boolean;
  checkedBrands: number;
  expiringSoonCount: number;
  expiredCount: number;
  socialTokenAlerts: SocialTokenAlert[];
  actionsTaken: string[];
}> {
  const dryRun = Boolean(options?.dryRun);
  const { getUnifiedGrowthBrands, getEzZelPersonalClients, persistBrandUpdateAcrossEcosystem } = await import('./obsidianVaultService');
  const brands = getUnifiedGrowthBrands();
  const clients = getEzZelPersonalClients();
  const subs = readPaymobSubscriptions();
  const events = loadLifecycleEvents();
  const seenKeys = new Set(events.map((e) => e.key));
  const todayStr = new Date().toISOString().slice(0, 10);

  let expiringSoonCount = 0;
  let expiredCount = 0;
  const socialTokenAlerts: SocialTokenAlert[] = [];
  const actionsTaken: string[] = [];

  for (const b of brands) {
    const brandId = String(b.canonicalId || b.id || b.slug);
    const linkedClient = clients.find(
      (c: any) =>
        c.linkedBrandId === b.id ||
        c.linkedBrandId === b.slug ||
        String(c.linkedBrandId || '').toLowerCase() === brandId.toLowerCase()
    );
    const paidSub = subs.find(
      (s: any) =>
        (s.brandId === b.id || s.brandId === b.slug || String(s.brandId || '').toLowerCase() === brandId.toLowerCase()) &&
        String(s.status || '').toLowerCase() === 'paid'
    );

    // 1. Check Expiry (paid expiresAt OR trialEndsAt)
    let expiryIso = '';
    if (paidSub?.expiresAt) {
      expiryIso = String(paidSub.expiresAt);
    } else if ((!paidSub || !isSubscriptionActiveNow(paidSub)) && linkedClient?.status === 'trial' && linkedClient?.trialEndsAt) {
      expiryIso = String(linkedClient.trialEndsAt);
    }

    if (expiryIso) {
      const msLeft = new Date(expiryIso).getTime() - Date.now();
      const hoursLeft = msLeft / (1000 * 60 * 60);

      if (hoursLeft > 0 && hoursLeft <= 48) {
        expiringSoonCount += 1;
        const dedupeKey = `reminder_48h:${brandId}:${todayStr}`;
        if (!seenKeys.has(dedupeKey)) {
          const msg = `تنبيه تجديد اشتراك "${b.name || brandId}": متبقي أقل من ${Math.ceil(hoursLeft)} ساعة على انتهاء الفترة الحالية (${expiryIso.slice(0, 10)}). للتجديد والاستمرار: https://ez-zel.onrender.com/pricing?brandId=${encodeURIComponent(b.slug || brandId)}`;
          actionsTaken.push(`${dryRun ? '[DRY] ' : ''}48h reminder for ${brandId}`);
          if (!dryRun) {
            events.push({ key: dedupeKey, brandId, kind: 'reminder_48h', message: msg, createdAt: new Date().toISOString() });
            seenKeys.add(dedupeKey);
            if (options?.notifier && (b.phone || linkedClient?.phone)) {
              await options.notifier(String(linkedClient?.phone || b.phone), msg).catch(() => {});
            }
          }
        }
      } else if (hoursLeft <= 0 && b.lifecycleStage !== 'paused_archive' && b.lifecycleStage !== 'self_growth') {
        expiredCount += 1;
        const dedupeKey = `expired:${brandId}:${todayStr}`;
        actionsTaken.push(`${dryRun ? '[DRY] ' : ''}Expire enforcement for ${brandId}`);
        if (!dryRun) {
          upsertBrandRegistryEntry(brandId, { lifecycleStage: 'paused_archive' });
          persistBrandUpdateAcrossEcosystem(brandId, { subscriptionStatus: 'expired', botPaused: true });
          if (!b.botPaused) {
            await t2AgentApi.togglePauseBot(String(b.agentBrandId || brandId)).catch(() => {});
          }
          if (!seenKeys.has(dedupeKey)) {
            events.push({
              key: dedupeKey,
              brandId,
              kind: 'expired_enforced',
              message: `تم إيقاف "${b.name || brandId}" تلقائياً لانتهاء مدة التجربة/الاشتراك في ${expiryIso}`,
              createdAt: new Date().toISOString(),
            });
            seenKeys.add(dedupeKey);
          }
        }
      }
    }

    // 2. Social Token Expiry Watcher (for active & self_growth brands)
    if (b.lifecycleStage === 'active_client' || b.lifecycleStage === 'self_growth') {
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      if (!b.metaPageId && !b.metaConnected) {
        socialTokenAlerts.push({
          brandId,
          brandName: b.name || brandId,
          platform: 'meta',
          reason: 'صفحة ميتا غير مربوطة (النشر التلقائي متوقف)',
        });
      }
      const tokenFields: Array<{ key: string; platform: 'meta' | 'tiktok' | 'youtube' }> = [
        { key: 'metaTokenExpiresAt', platform: 'meta' },
        { key: 'tiktokTokenExpiresAt', platform: 'tiktok' },
        { key: 'youtubeTokenExpiresAt', platform: 'youtube' },
      ];
      for (const tf of tokenFields) {
        const exp = b[tf.key];
        if (exp) {
          const diff = new Date(exp).getTime() - Date.now();
          if (!Number.isNaN(diff) && diff <= fiveDaysMs) {
            socialTokenAlerts.push({
              brandId,
              brandName: b.name || brandId,
              platform: tf.platform,
              expiresAt: String(exp),
              reason: diff <= 0 ? `توكن ${tf.platform} منتهي الصلاحية` : `توكن ${tf.platform} ينتهي خلال أقل من 5 أيام`,
            });
          }
        }
      }
    }
  }

  if (!dryRun) {
    saveLifecycleEvents(events);
  }

  return {
    dryRun,
    checkedBrands: brands.length,
    expiringSoonCount,
    expiredCount,
    socialTokenAlerts,
    actionsTaken,
  };
}
