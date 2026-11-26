import { readPersistentJson, savePersistentJson } from './persistentStorage';
import { resolveBrandTemplate, TenantAppTemplate } from './tenantAppRenderer';
import { areBrandIdsEquivalent, toAlnumLookupKey, toCanonicalAgentId, toCanonicalSlug } from './brandIdentityNormalizer';
import { isPostgresConfigured, pgDeleteTenant, pgUpsertTenant } from './postgresService';

export type BrandLifecycleStage = 'active_client' | 'trial' | 'paused_archive' | 'self_growth';
export type BrandAccountOrigin = 'admin_managed' | 'public_signup';

export interface CanonicalBrandEntry {
  canonicalId: string;
  slug: string;
  name?: string;
  businessType?: string;
  primaryColor?: string;
  dedicatedLiveUrl?: string;
  dedicatedRepoUrl?: string;
  appUrl?: string;
  lifecycleStage: BrandLifecycleStage;
  accountOrigin?: BrandAccountOrigin;
  appTemplate?: TenantAppTemplate;
  titoStudioClinicId?: string;
  agentBrandId?: string;
  planId?: string;
  planAmount?: number;
  trialStartedAt?: string;
  trialEndsAt?: string;
  paidExpiresAt?: string;
  subscriptionStatus?: 'active' | 'trial' | 'expired';
  mergedFromIds?: string[];
  notes?: string;
  updatedAt: string;
}

interface BrandRegistryState {
  defaultStage: BrandLifecycleStage;
  coreNineSeededV1?: boolean;
  brands: Record<string, CanonicalBrandEntry>;
  updatedAt?: string;
}

const REGISTRY_DOC_KEY = 't2_unified_brand_registry';
const REGISTRY_FILE = 't2_unified_brand_registry.json';

const CORE_ACTIVE_BRANDS_SEED: Array<Omit<CanonicalBrandEntry, 'updatedAt'>> = [
  {
    canonicalId: 'al_shomoukh_dentistry',
    slug: 'al_shomoukh_dentistry',
    name: 'الشموخ لطب الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/al-shomoukh-dentistry',
    titoStudioClinicId: 'brand_1786261318926',
    agentBrandId: 'al_shomoukh_dentistry',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['brand_1786261318926', 'رعاية_صحية_وطب_أسنان'],
  },
  {
    canonicalId: 'crystal_teeth',
    slug: 'crystal_teeth',
    name: 'عيادة كريستال لطب الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/crystal-teeth',
    titoStudioClinicId: '2',
    agentBrandId: 'crystal_teeth',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['2'],
  },
  {
    canonicalId: 'alkhalig_dental',
    slug: 'alkhalig_dental',
    name: 'عيادة الخليج لطب الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/alkhalig-dental',
    titoStudioClinicId: '4',
    agentBrandId: 'alkhalig_dental',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['4'],
  },
  {
    canonicalId: 'socotra_dental',
    slug: 'socotra_dental',
    name: 'عيادة سقطرى لطب الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/socotra-dental',
    titoStudioClinicId: '3',
    agentBrandId: 'socotra_dental',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['3'],
  },
  {
    canonicalId: 'dental_district',
    slug: 'dental_district',
    name: 'عيادة حي الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/dental-district',
    titoStudioClinicId: '5',
    agentBrandId: 'dental_district',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['5'],
  },
  {
    canonicalId: 'mecca_dental',
    slug: 'mecca_dental',
    name: 'عيادة مكة لطب الأسنان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/mecca-dental',
    titoStudioClinicId: '6',
    agentBrandId: 'mecca_dental',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['6'],
  },
  {
    canonicalId: 'clean_master',
    slug: 'clean_master',
    name: 'كلين ماستر',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    appUrl: 'https://book.t2os.app/b/clean-master',
    titoStudioClinicId: 'brand_1788540631941',
    agentBrandId: 'clean_master',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['brand_1788540631941'],
  },
  {
    canonicalId: 'tito_media',
    slug: 'tito_media',
    name: 'تيتو ميديا',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'services_booking',
    titoStudioClinicId: 'brand_1779847291377',
    agentBrandId: 'tito_media',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['brand_1779847291377', 't2_studio', 't2_studio_وكالة_تسويق_ونمو_رقمي_وأتمتة', 'تسويق_ونمو_رقمي_وأتمتة'],
  },
  {
    canonicalId: 'al_genedy',
    slug: 'al_genedy',
    name: 'الجنيدي للإعلان',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'products_erp',
    titoStudioClinicId: 'al_genedy',
    agentBrandId: 'al_genedy',
    appUrl: process.env.AL_GENEDY_STANDALONE_URL || 'https://elgenedy.com',
    planId: 'growth_5000',
    planAmount: 5000,
  },
  {
    canonicalId: 'auto_house',
    slug: 'auto-house',
    name: 'أوتو هاوس لقطع غيار السيارات',
    lifecycleStage: 'active_client',
    accountOrigin: 'admin_managed',
    appTemplate: 'products_erp',
    titoStudioClinicId: 'auto-house',
    agentBrandId: 'auto_house',
    appUrl: 'https://t2-tenant-auto-house.vercel.app',
    planId: 'growth_5000',
    planAmount: 5000,
    mergedFromIds: ['auto-house', 'أوتو_هاوس_لقطع_غيار_السيارات_auto_house'],
  },
];

export const CORE_ADMIN_MANAGED_IDS = new Set(CORE_ACTIVE_BRANDS_SEED.map((s) => s.canonicalId));

function normalizeKey(id: string): string {
  return String(id || '').trim().toLowerCase();
}

export function getBrandRegistryState(): BrandRegistryState {
  const raw = readPersistentJson<BrandRegistryState>(REGISTRY_FILE, {
    defaultStage: 'paused_archive',
    brands: {},
  });
  const brands = raw?.brands && typeof raw.brands === 'object' ? { ...raw.brands } : {};
  let changed = false;

  if (!raw?.coreNineSeededV1) {
    const now = new Date().toISOString();
    for (const seed of CORE_ACTIVE_BRANDS_SEED) {
      const prev = brands[seed.canonicalId] || {};
      brands[seed.canonicalId] = {
        ...prev,
        ...seed,
        updatedAt: now,
      };
    }
    changed = true;
  }

  // Ensure legacy/admin-managed brands stay tagged & seeded with canonical live URLs even on persisted state
  for (const seed of CORE_ACTIVE_BRANDS_SEED) {
    const cur = brands[seed.canonicalId];
    if (!cur) {
      brands[seed.canonicalId] = {
        ...seed,
        updatedAt: new Date().toISOString(),
      };
      if (Array.isArray(seed.mergedFromIds)) {
        for (const alias of seed.mergedFromIds) {
          if (alias !== seed.canonicalId && brands[alias]) {
            delete brands[alias];
          }
        }
      }
      changed = true;
    } else {
      const needsOrigin = cur.accountOrigin !== 'admin_managed';
      const needsUrl =
        seed.appUrl &&
        (!cur.appUrl || cur.appUrl.startsWith('/store/') || cur.appUrl.includes('al-genedy.vercel.app'));
      if (needsOrigin || needsUrl) {
        brands[seed.canonicalId] = {
          ...cur,
          accountOrigin: 'admin_managed',
          ...(needsUrl ? { appUrl: seed.appUrl } : {}),
        };
        changed = true;
      }
    }
  }

  const state: BrandRegistryState = {
    defaultStage: raw?.defaultStage || 'paused_archive',
    coreNineSeededV1: true,
    brands,
    updatedAt: raw?.updatedAt,
  };

  if (changed) {
    saveBrandRegistryState(state);
  }
  return state;
}

export function saveBrandRegistryState(state: BrandRegistryState): BrandRegistryState {
  const next: BrandRegistryState = {
    defaultStage: state.defaultStage || 'paused_archive',
    coreNineSeededV1: state.coreNineSeededV1 ?? true,
    brands: state.brands || {},
    updatedAt: new Date().toISOString(),
  };
  savePersistentJson(REGISTRY_DOC_KEY, REGISTRY_FILE, next);
  return next;
}

export function upsertBrandRegistryEntry(
  canonicalId: string,
  updates: Partial<CanonicalBrandEntry>
): CanonicalBrandEntry {
  const key = String(canonicalId || '').trim();
  const state = getBrandRegistryState();
  const matchedKey =
    state.brands[key]
      ? key
      : Object.keys(state.brands).find((k) => {
          const item = state.brands[k];
          return (
            areBrandIdsEquivalent(k, key) ||
            areBrandIdsEquivalent(item?.slug, key) ||
            areBrandIdsEquivalent(item?.canonicalId, key) ||
            (updates.slug ? areBrandIdsEquivalent(item?.slug, updates.slug) : false)
          );
        }) || key;

  const existing = state.brands[matchedKey] || {
    canonicalId: matchedKey,
    slug: toCanonicalSlug(updates.slug || matchedKey),
    lifecycleStage: state.defaultStage || 'paused_archive',
    updatedAt: new Date().toISOString(),
  };

  const resolvedSlug = toCanonicalSlug(updates.slug || existing.slug || matchedKey);
  const merged: CanonicalBrandEntry = {
    ...existing,
    ...updates,
    canonicalId: existing.canonicalId || matchedKey,
    slug: resolvedSlug,
    titoStudioClinicId: updates.titoStudioClinicId || existing.titoStudioClinicId || existing.canonicalId || matchedKey,
    agentBrandId: toCanonicalAgentId(updates.agentBrandId || existing.agentBrandId || resolvedSlug),
    updatedAt: new Date().toISOString(),
  };

  state.brands[merged.canonicalId] = merged;
  saveBrandRegistryState(state);
  void import('./redisCacheService')
    .then(({ invalidateCacheKeys }) =>
      invalidateCacheKeys([
        `t2os:brand:${merged.canonicalId.toLowerCase()}:slim`,
        `t2os:brand:${merged.canonicalId.toLowerCase()}:full`,
        `t2os:brand:${merged.slug.toLowerCase()}:slim`,
        `t2os:brand:${merged.slug.toLowerCase()}:full`,
        't2os:brands:all:slim',
        't2os:brands:all:full',
      ])
    )
    .catch(() => {});

  if (isPostgresConfigured()) {
    void pgUpsertTenant({
      canonicalId: merged.canonicalId,
      slug: merged.slug,
      name: merged.name || merged.canonicalId,
      industry: merged.businessType,
      appTemplate: merged.appTemplate || 'products_erp',
      lifecycleStage: merged.lifecycleStage,
      subscriptionStatus:
        merged.subscriptionStatus ||
        (merged.lifecycleStage === 'active_client' ? 'active' : merged.lifecycleStage === 'paused_archive' ? 'expired' : 'trial'),
      planId: merged.planId || (merged.lifecycleStage === 'active_client' ? 'growth_5000' : 'trial_7d'),
      planAmountEgp: merged.planAmount || 0,
      trialStartedAt: merged.trialStartedAt || null,
      trialEndsAt: merged.trialEndsAt || null,
      paidExpiresAt: merged.paidExpiresAt || null,
      titoStudioId: merged.titoStudioClinicId,
      agentBrandId: merged.agentBrandId,
      storeUrl: merged.appUrl,
      dedicatedLiveUrl: merged.dedicatedLiveUrl,
      metadata: { notes: merged.notes, primaryColor: merged.primaryColor },
    }).catch(() => {});
  }

  return merged;
}

export async function deleteBrandRegistryEntry(slugOrId: string): Promise<boolean> {
  const key = String(slugOrId || '').trim();
  const state = getBrandRegistryState();
  let removed = false;
  for (const k of Object.keys(state.brands)) {
    const item = state.brands[k];
    if (
      areBrandIdsEquivalent(k, key) ||
      areBrandIdsEquivalent(item?.slug, key) ||
      areBrandIdsEquivalent(item?.canonicalId, key)
    ) {
      delete state.brands[k];
      removed = true;
    }
  }
  if (removed) {
    saveBrandRegistryState(state);
    void import('./redisCacheService')
      .then(({ invalidateCacheKeys }) =>
        invalidateCacheKeys([
          `t2os:brand:${key.toLowerCase()}:slim`,
          `t2os:brand:${key.toLowerCase()}:full`,
          't2os:brands:all:slim',
          't2os:brands:all:full',
        ])
      )
      .catch(() => {});
  }
  if (isPostgresConfigured()) {
    await pgDeleteTenant(toCanonicalSlug(key, key)).catch(() => {});
  }
  return removed;
}

export function bulkSetBrandLifecycle(
  brandIds: string[],
  lifecycleStage: BrandLifecycleStage
): BrandRegistryState {
  const state = getBrandRegistryState();
  const now = new Date().toISOString();
  for (const id of brandIds) {
    const key = String(id || '').trim();
    if (!key) continue;
    const prev = state.brands[key] || { canonicalId: key, slug: key };
    state.brands[key] = {
      ...prev,
      canonicalId: key,
      slug: prev.slug || key,
      lifecycleStage,
      updatedAt: now,
    };
  }
  return saveBrandRegistryState(state);
}

export function applyRegistryToBrands(rawBrands: any[]): any[] {
  const state = getBrandRegistryState();
  const defaultStage: BrandLifecycleStage = state.defaultStage || 'paused_archive';

  // Build set of alias IDs that were merged into another canonical record
  const mergedAliases = new Set<string>();
  Object.values(state.brands).forEach((entry) => {
    if (Array.isArray(entry.mergedFromIds)) {
      entry.mergedFromIds.forEach((alias) => mergedAliases.add(normalizeKey(alias)));
    }
  });

  const out: any[] = [];
  const seenCanonicalIds = new Set<string>();
  for (const b of rawBrands) {
    if (!b || !b.id) continue;
    const normId = normalizeKey(b.id);
    const normSlug = normalizeKey(b.slug || b.id);
    if (mergedAliases.has(normId) || mergedAliases.has(normSlug)) {
      continue;
    }

    const entry =
      state.brands[b.id] ||
      state.brands[b.slug] ||
      Object.values(state.brands).find(
        (e) =>
          areBrandIdsEquivalent(e.canonicalId, b.id) ||
          areBrandIdsEquivalent(e.slug, b.slug || b.id) ||
          toAlnumLookupKey(e.slug || e.canonicalId) === toAlnumLookupKey(b.slug || b.id)
      );

    seenCanonicalIds.add(normalizeKey(entry?.canonicalId || b.id));
    seenCanonicalIds.add(normalizeKey(entry?.slug || b.slug || b.id));
    seenCanonicalIds.add(toAlnumLookupKey(entry?.canonicalId || b.id));
    seenCanonicalIds.add(toAlnumLookupKey(entry?.slug || b.slug || b.id));

    const lifecycleStage: BrandLifecycleStage = entry?.lifecycleStage || defaultStage;
    const isPaused = lifecycleStage === 'paused_archive';
    const resolvedTemplate = entry?.appTemplate || resolveBrandTemplate(b);

    const resolvedPlanId = entry?.planId || b.planId || (lifecycleStage === 'active_client' ? 'growth_5000' : b.planId);
    const resolvedPlanAmount = entry?.planAmount ?? b.planAmount ?? (lifecycleStage === 'active_client' ? 5000 : 0);
    const resolvedDedicatedUrl = entry?.dedicatedLiveUrl || b.dedicatedLiveUrl || undefined;
    const resolvedAppUrl =
      [entry?.dedicatedLiveUrl, entry?.appUrl, b.dedicatedLiveUrl, b.appUrl].find(
        (u) => typeof u === 'string' && /^https?:\/\//i.test(u.trim())
      ) ||
      b.appUrl ||
      `/store/${entry?.slug || b.slug || b.id}`;

    out.push({
      ...b,
      canonicalId: entry?.canonicalId || b.id,
      slug: entry?.slug || b.slug || b.id,
      name: entry?.name || b.name || b.id,
      businessType: entry?.businessType || b.businessType,
      primaryColor: entry?.primaryColor || b.primaryColor,
      dedicatedLiveUrl: resolvedDedicatedUrl,
      dedicatedRepoUrl: entry?.dedicatedRepoUrl || b.dedicatedRepoUrl,
      appUrl: resolvedAppUrl,
      lifecycleStage,
      accountOrigin:
        entry?.accountOrigin ||
        b.accountOrigin ||
        (CORE_ADMIN_MANAGED_IDS.has(String(entry?.canonicalId || b.id || '').toLowerCase())
          ? 'admin_managed'
          : 'public_signup'),
      appTemplate: resolvedTemplate,
      titoStudioClinicId: entry?.titoStudioClinicId || b.titoStudioClinicId || b.id,
      agentBrandId: entry?.agentBrandId || b.agentBrandId || b.id,
      planId: resolvedPlanId,
      planAmount: resolvedPlanAmount,
      ...(entry?.trialStartedAt || b.trialStartedAt ? { trialStartedAt: entry?.trialStartedAt || b.trialStartedAt } : {}),
      ...(entry?.trialEndsAt || b.trialEndsAt ? { trialEndsAt: entry?.trialEndsAt || b.trialEndsAt } : {}),
      ...(entry?.paidExpiresAt || b.paidExpiresAt ? { paidExpiresAt: entry?.paidExpiresAt || b.paidExpiresAt } : {}),
      ...(entry?.subscriptionStatus || b.subscriptionStatus ? { subscriptionStatus: entry?.subscriptionStatus || b.subscriptionStatus } : {}),
      subscriptionPlan: lifecycleStage === 'active_client' ? `باقة النمو الذهبي (${resolvedPlanAmount.toLocaleString('en-US')} ج.م)` : (b.subscriptionPlan || 'متوقف'),
      status: isPaused ? 'متوقف' : (b.status && b.status !== 'متوقف' ? b.status : 'شغال'),
      botPaused: isPaused ? true : Boolean(b.botPaused),
      registrySynced: Boolean(entry),
    });
  }

  for (const entry of Object.values(state.brands)) {
    if (!entry?.canonicalId) continue;
    const normCid = normalizeKey(entry.canonicalId);
    const normEntrySlug = normalizeKey(entry.slug || entry.canonicalId);
    if (
      seenCanonicalIds.has(normCid) ||
      seenCanonicalIds.has(normEntrySlug) ||
      seenCanonicalIds.has(toAlnumLookupKey(normCid)) ||
      seenCanonicalIds.has(toAlnumLookupKey(normEntrySlug)) ||
      mergedAliases.has(normCid)
    ) {
      continue;
    }
    const lifecycleStage: BrandLifecycleStage = entry.lifecycleStage || defaultStage;
    const isPaused = lifecycleStage === 'paused_archive';
    const planAmount = entry.planAmount ?? (lifecycleStage === 'active_client' ? 5000 : 0);
    out.push({
      id: entry.canonicalId,
      canonicalId: entry.canonicalId,
      slug: entry.slug || entry.canonicalId,
      name: entry.name || entry.canonicalId,
      businessType: entry.businessType || 'تجارة إلكترونية',
      primaryColor: entry.primaryColor || '#06b6d4',
      phone: '',
      whatsapp: '',
      conversationsCount: 0,
      lifecycleStage,
      accountOrigin: entry.accountOrigin || (CORE_ADMIN_MANAGED_IDS.has(normCid) ? 'admin_managed' : 'public_signup'),
      appTemplate: entry.appTemplate || 'products_erp',
      titoStudioClinicId: entry.titoStudioClinicId || entry.canonicalId,
      agentBrandId: entry.agentBrandId || entry.canonicalId,
      dedicatedLiveUrl: entry.dedicatedLiveUrl,
      dedicatedRepoUrl: entry.dedicatedRepoUrl,
      appUrl: entry.dedicatedLiveUrl || entry.appUrl || `/store/${entry.slug || entry.canonicalId}`,
      planId: entry.planId || (lifecycleStage === 'active_client' ? 'growth_5000' : ''),
      planAmount,
      ...(entry.trialStartedAt ? { trialStartedAt: entry.trialStartedAt } : {}),
      ...(entry.trialEndsAt ? { trialEndsAt: entry.trialEndsAt } : {}),
      ...(entry.paidExpiresAt ? { paidExpiresAt: entry.paidExpiresAt } : {}),
      ...(entry.subscriptionStatus ? { subscriptionStatus: entry.subscriptionStatus } : {}),
      subscriptionPlan:
        lifecycleStage === 'active_client'
          ? `باقة النمو الذهبي (${Number(planAmount).toLocaleString('en-US')} ج.م)`
          : lifecycleStage === 'trial'
            ? 'تجربة مجانية 7 أيام'
            : 'متوقف',
      status: isPaused ? 'متوقف' : 'شغال',
      botPaused: isPaused,
      productsCatalog: [],
      weekContentPlan: [],
      registrySynced: true,
    });
  }

  return out;
}
