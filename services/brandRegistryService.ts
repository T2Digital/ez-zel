import { readPersistentJson, savePersistentJson } from './persistentStorage';
import { resolveBrandTemplate, TenantAppTemplate } from './tenantAppRenderer';

export type BrandLifecycleStage = 'active_client' | 'trial' | 'paused_archive' | 'self_growth';

export interface CanonicalBrandEntry {
  canonicalId: string;
  slug: string;
  name?: string;
  lifecycleStage: BrandLifecycleStage;
  appTemplate?: TenantAppTemplate;
  titoStudioClinicId?: string;
  agentBrandId?: string;
  planId?: string;
  planAmount?: number;
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'services_booking',
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
    appTemplate: 'products_erp',
    titoStudioClinicId: 'al_genedy',
    agentBrandId: 'al_genedy',
    planId: 'growth_5000',
    planAmount: 5000,
  },
];

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
  const existing = state.brands[key] || {
    canonicalId: key,
    slug: updates.slug || key,
    lifecycleStage: state.defaultStage || 'paused_archive',
    updatedAt: new Date().toISOString(),
  };

  const merged: CanonicalBrandEntry = {
    ...existing,
    ...updates,
    canonicalId: key,
    slug: updates.slug || existing.slug || key,
    updatedAt: new Date().toISOString(),
  };

  state.brands[key] = merged;
  saveBrandRegistryState(state);
  return merged;
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
        (e) => normalizeKey(e.canonicalId) === normId || normalizeKey(e.slug) === normSlug
      );

    const lifecycleStage: BrandLifecycleStage = entry?.lifecycleStage || defaultStage;
    const isPaused = lifecycleStage === 'paused_archive';
    const resolvedTemplate = entry?.appTemplate || resolveBrandTemplate(b);

    const resolvedPlanId = entry?.planId || b.planId || (lifecycleStage === 'active_client' ? 'growth_5000' : b.planId);
    const resolvedPlanAmount = entry?.planAmount ?? b.planAmount ?? (lifecycleStage === 'active_client' ? 5000 : 0);

    out.push({
      ...b,
      canonicalId: entry?.canonicalId || b.id,
      slug: entry?.slug || b.slug || b.id,
      name: entry?.name || b.name || b.id,
      lifecycleStage,
      appTemplate: resolvedTemplate,
      titoStudioClinicId: entry?.titoStudioClinicId || b.titoStudioClinicId || b.id,
      agentBrandId: entry?.agentBrandId || b.agentBrandId || b.id,
      planId: resolvedPlanId,
      planAmount: resolvedPlanAmount,
      subscriptionPlan: lifecycleStage === 'active_client' ? `باقة النمو الذهبي (${resolvedPlanAmount.toLocaleString('en-US')} ج.م)` : (b.subscriptionPlan || 'متوقف'),
      status: isPaused ? 'متوقف' : (b.status && b.status !== 'متوقف' ? b.status : 'شغال'),
      botPaused: isPaused ? true : Boolean(b.botPaused),
      registrySynced: Boolean(entry),
    });
  }

  return out;
}
