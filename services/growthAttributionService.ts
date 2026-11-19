import { readPersistentJson, savePersistentJson } from './persistentStorage';

export type AttributionStage = 'visit' | 'trial_started' | 'paid_converted';

export interface AttributionEvent {
  id: string;
  leadId?: string;
  brandId?: string;
  stage: AttributionStage;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent?: string;
  revenueEgp: number;
  createdAt: string;
}

export interface CampaignSpendRecord {
  utmCampaign: string;
  adSpendEgp: number;
  note?: string;
  updatedAt: string;
}

interface AttributionStore {
  events: AttributionEvent[];
  spends: Record<string, CampaignSpendRecord>;
}

const DOC_KEY = 't2_utm_attributions';
const FILE_NAME = 't2_utm_attributions.json';

function loadStore(): AttributionStore {
  const raw = readPersistentJson<AttributionStore>(FILE_NAME, { events: [], spends: {} });
  return {
    events: Array.isArray(raw?.events) ? raw.events : [],
    spends: raw?.spends && typeof raw.spends === 'object' ? raw.spends : {},
  };
}

function saveStore(store: AttributionStore): void {
  savePersistentJson(DOC_KEY, FILE_NAME, store);
}

export function recordAttributionEvent(input: {
  leadId?: string;
  brandId?: string;
  stage: AttributionStage;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  revenueEgp?: number;
}): AttributionEvent {
  const store = loadStore();
  const evt: AttributionEvent = {
    id: `attr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    leadId: input.leadId ? String(input.leadId).trim() : undefined,
    brandId: input.brandId ? String(input.brandId).trim() : undefined,
    stage: input.stage,
    utmSource: String(input.utmSource || 'organic').trim(),
    utmMedium: String(input.utmMedium || 'direct').trim(),
    utmCampaign: String(input.utmCampaign || 'self_growth_default').trim(),
    utmContent: input.utmContent ? String(input.utmContent).trim() : undefined,
    revenueEgp: Number(input.revenueEgp || 0) || 0,
    createdAt: new Date().toISOString(),
  };
  store.events.push(evt);
  if (store.events.length > 5000) {
    store.events = store.events.slice(-5000);
  }
  saveStore(store);
  return evt;
}

export function recordCampaignAdSpend(utmCampaign: string, adSpendEgp: number, note?: string): CampaignSpendRecord {
  const key = String(utmCampaign || 'self_growth_default').trim();
  const store = loadStore();
  const prev = Number(store.spends[key]?.adSpendEgp || 0);
  const rec: CampaignSpendRecord = {
    utmCampaign: key,
    adSpendEgp: Math.max(0, prev + (Number(adSpendEgp) || 0)),
    note: note || store.spends[key]?.note,
    updatedAt: new Date().toISOString(),
  };
  store.spends[key] = rec;
  saveStore(store);
  return rec;
}

export function getCampaignRoasSummary() {
  const store = loadStore();
  const map = new Map<
    string,
    {
      utmCampaign: string;
      visits: number;
      trials: number;
      paidConversions: number;
      totalRevenueEgp: number;
      totalAdSpendEgp: number;
    }
  >();

  const ensure = (camp: string) => {
    if (!map.has(camp)) {
      map.set(camp, {
        utmCampaign: camp,
        visits: 0,
        trials: 0,
        paidConversions: 0,
        totalRevenueEgp: 0,
        totalAdSpendEgp: 0,
      });
    }
    return map.get(camp)!;
  };

  for (const ev of store.events) {
    const row = ensure(ev.utmCampaign || 'self_growth_default');
    if (ev.stage === 'visit') row.visits += 1;
    else if (ev.stage === 'trial_started') row.trials += 1;
    else if (ev.stage === 'paid_converted') {
      row.paidConversions += 1;
      row.totalRevenueEgp += Number(ev.revenueEgp || 0);
    }
  }

  for (const [camp, sp] of Object.entries(store.spends)) {
    const row = ensure(camp);
    row.totalAdSpendEgp = Number(sp?.adSpendEgp || 0);
  }

  const campaigns = Array.from(map.values()).map((c) => {
    const denominator = c.visits > 0 ? c.visits : c.trials;
    const conversionRatePct = denominator > 0 ? Number(((c.paidConversions / denominator) * 100).toFixed(2)) : 0;
    const roas = c.totalAdSpendEgp > 0 ? Number((c.totalRevenueEgp / c.totalAdSpendEgp).toFixed(2)) : 0;
    return {
      ...c,
      conversionRatePct,
      roas,
    };
  });

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.visits += c.visits;
      acc.trials += c.trials;
      acc.paidConversions += c.paidConversions;
      acc.totalRevenueEgp += c.totalRevenueEgp;
      acc.totalAdSpendEgp += c.totalAdSpendEgp;
      return acc;
    },
    { visits: 0, trials: 0, paidConversions: 0, totalRevenueEgp: 0, totalAdSpendEgp: 0 }
  );

  const globalRoas = totals.totalAdSpendEgp > 0 ? Number((totals.totalRevenueEgp / totals.totalAdSpendEgp).toFixed(2)) : 0;
  return {
    campaigns,
    totals: {
      ...totals,
      roas: globalRoas,
    },
  };
}

export function deleteAttributionCampaignForTest(utmCampaign: string): void {
  const key = String(utmCampaign || '').trim();
  if (!key) return;
  const store = loadStore();
  store.events = store.events.filter((e) => e.utmCampaign !== key);
  delete store.spends[key];
  saveStore(store);
}
