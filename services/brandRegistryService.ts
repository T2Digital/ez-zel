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
  mergedFromIds?: string[];
  notes?: string;
  updatedAt: string;
}

interface BrandRegistryState {
  defaultStage: BrandLifecycleStage;
  brands: Record<string, CanonicalBrandEntry>;
  updatedAt?: string;
}

const REGISTRY_DOC_KEY = 't2_unified_brand_registry';
const REGISTRY_FILE = 't2_unified_brand_registry.json';

function normalizeKey(id: string): string {
  return String(id || '').trim().toLowerCase();
}

export function getBrandRegistryState(): BrandRegistryState {
  const raw = readPersistentJson<BrandRegistryState>(REGISTRY_FILE, {
    defaultStage: 'paused_archive',
    brands: {},
  });
  return {
    defaultStage: raw?.defaultStage || 'paused_archive',
    brands: raw?.brands && typeof raw.brands === 'object' ? raw.brands : {},
    updatedAt: raw?.updatedAt,
  };
}

export function saveBrandRegistryState(state: BrandRegistryState): BrandRegistryState {
  const next: BrandRegistryState = {
    defaultStage: state.defaultStage || 'paused_archive',
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

    out.push({
      ...b,
      canonicalId: entry?.canonicalId || b.id,
      slug: entry?.slug || b.slug || b.id,
      name: entry?.name || b.name || b.id,
      lifecycleStage,
      appTemplate: resolvedTemplate,
      titoStudioClinicId: entry?.titoStudioClinicId || b.titoStudioClinicId || b.id,
      agentBrandId: entry?.agentBrandId || b.agentBrandId || b.id,
      status: isPaused ? 'متوقف' : (b.status && b.status !== 'متوقف' ? b.status : 'شغال'),
      botPaused: isPaused ? true : Boolean(b.botPaused),
      registrySynced: Boolean(entry),
    });
  }

  return out;
}
