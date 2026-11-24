import { readPersistentJson, savePersistentJson } from "./persistentStorage";
import { isPostgresConfigured, pgRecordAiUsage, pgGetAiUsageSummary } from "./postgresService";
import { toCanonicalSlug } from "./brandIdentityNormalizer";

export interface AiCostRecordInput {
  brandId: string;
  service: "ez-zel" | "t2-studio" | "t2-agent" | string;
  operation: "text" | "vision" | "image" | "video" | "agent_reply" | "tts" | string;
  model: string;
  inputUnits?: number;
  outputUnits?: number;
  explicitCostUsd?: number;
}

const LOCAL_FILE = "ai_cost_ledger_local.json";
const LOCAL_DOC_KEY = "t2_ai_cost_ledger_local";
const DEFAULT_USD_TO_EGP = 50;

export function getUsdToEgpRate(): number {
  const n = Number(process.env.USD_TO_EGP_RATE || DEFAULT_USD_TO_EGP);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_USD_TO_EGP;
}

export function estimateAiOperationCostUsd(input: AiCostRecordInput): number {
  if (typeof input.explicitCostUsd === "number" && input.explicitCostUsd >= 0) {
    return input.explicitCostUsd;
  }
  const op = String(input.operation || "text").toLowerCase();
  const model = String(input.model || "").toLowerCase();

  if (op === "video" || model.includes("veo")) {
    return model.includes("fast") ? 0.25 : 0.60;
  }
  if (op === "image" || model.includes("imagen") || model.includes("flash-image")) {
    return 0.039;
  }
  if (op === "tts") {
    return 0.004;
  }

  const inUnits = Math.max(0, Number(input.inputUnits || 800));
  const outUnits = Math.max(0, Number(input.outputUnits || 350));
  // Gemini 2.5/3.0 Flash average blends (~$0.15 / 1M input, ~$0.60 / 1M output)
  const usd = (inUnits / 1_000_000) * 0.15 + (outUnits / 1_000_000) * 0.60;
  return Math.max(0.0002, Number(usd.toFixed(6)));
}

export async function recordAiCostEvent(input: AiCostRecordInput): Promise<void> {
  const brandId = input.brandId ? toCanonicalSlug(input.brandId, "system") : "system";
  const costUsd = estimateAiOperationCostUsd(input);
  const costEgp = Number((costUsd * getUsdToEgpRate()).toFixed(4));

  if (isPostgresConfigured()) {
    await pgRecordAiUsage({
      brandId,
      service: input.service,
      operation: input.operation,
      model: input.model,
      inputUnits: input.inputUnits,
      outputUnits: input.outputUnits,
      estimatedCostUsd: costUsd,
      estimatedCostEgp: costEgp,
    }).catch(() => {});
  }

  // Also keep a bounded local rolling mirror for environments/tests without Postgres
  try {
    const existing = readPersistentJson<any[]>(LOCAL_FILE, []);
    const list = Array.isArray(existing) ? existing : [];
    list.unshift({
      brandId,
      service: input.service,
      operation: input.operation,
      model: input.model,
      inputUnits: Number(input.inputUnits || 0),
      outputUnits: Number(input.outputUnits || 0),
      estimatedCostUsd: costUsd,
      estimatedCostEgp: costEgp,
      createdAt: new Date().toISOString(),
    });
    savePersistentJson(LOCAL_DOC_KEY, LOCAL_FILE, list.slice(0, 2000));
  } catch {}
}

export async function getBrandAiCostMarginsSummary(
  brands: any[],
  days = 30
): Promise<{
  windowDays: number;
  usdToEgpRate: number;
  totals: {
    totalCostUsd: number;
    totalCostEgp: number;
    totalCalls: number;
    totalNetSystemRevenueEgp: number;
  };
  perBrand: Array<{
    brandId: string;
    brandName: string;
    planId: string;
    subscriptionEgp: number;
    netSystemRevenueEgp: number;
    textAndAgentCalls: number;
    imagesGenerated: number;
    videosGenerated: number;
    totalAiCostUsd: number;
    totalAiCostEgp: number;
    netMarginEgp: number;
    netMarginPct: number;
  }>;
}> {
  const rate = getUsdToEgpRate();
  let rows: Array<{ brandId: string; operation: string; calls: number; totalUsd: number; totalEgp: number }> = [];

  if (isPostgresConfigured()) {
    rows = await pgGetAiUsageSummary(days);
  }
  if (rows.length === 0) {
    const cutoff = Date.now() - Math.max(1, days) * 86400_000;
    const localList = readPersistentJson<any[]>(LOCAL_FILE, []);
    const map = new Map<string, { brandId: string; operation: string; calls: number; totalUsd: number; totalEgp: number }>();
    for (const r of Array.isArray(localList) ? localList : []) {
      if (r.createdAt && new Date(r.createdAt).getTime() < cutoff) continue;
      const key = `${r.brandId}::${r.operation}`;
      const cur = map.get(key) || { brandId: r.brandId, operation: r.operation, calls: 0, totalUsd: 0, totalEgp: 0 };
      cur.calls += 1;
      cur.totalUsd += Number(r.estimatedCostUsd || 0);
      cur.totalEgp += Number(r.estimatedCostEgp || 0);
      map.set(key, cur);
    }
    rows = Array.from(map.values());
  }

  const agg = new Map<string, { textCalls: number; images: number; videos: number; usd: number; egp: number }>();
  for (const r of rows) {
    const key = toCanonicalSlug(r.brandId || "system", "system");
    const cur = agg.get(key) || { textCalls: 0, images: 0, videos: 0, usd: 0, egp: 0 };
    const op = String(r.operation || "").toLowerCase();
    if (op === "image") cur.images += Number(r.calls || 0);
    else if (op === "video") cur.videos += Number(r.calls || 0);
    else cur.textCalls += Number(r.calls || 0);
    cur.usd += Number(r.totalUsd || 0);
    cur.egp += Number(r.totalEgp || 0);
    agg.set(key, cur);
  }

  const brandMeta = new Map<string, any>();
  for (const b of Array.isArray(brands) ? brands : []) {
    const key = toCanonicalSlug(String(b.slug || b.canonicalId || b.id || ""), "");
    if (key) brandMeta.set(key, b);
  }

  const allKeys = new Set<string>([...agg.keys(), ...brandMeta.keys()]);
  const perBrand: any[] = [];
  let totalCostUsd = 0;
  let totalCostEgp = 0;
  let totalCalls = 0;
  let totalNetSystemRevenueEgp = 0;

  for (const k of allKeys) {
    const stats = agg.get(k) || { textCalls: 0, images: 0, videos: 0, usd: 0, egp: 0 };
    const b = brandMeta.get(k);
    if (!b && stats.textCalls + stats.images + stats.videos === 0) continue;

    const subPrice = Number(b?.planAmount || (b?.lifecycleStage === "active_client" ? 5000 : 0)) || 0;
    const netSystemRev = b?.subscriptionStatus === "trial" ? 0 : Math.round(subPrice * 0.5);
    const costUsd = Number(stats.usd.toFixed(4));
    const costEgp = Number(stats.egp.toFixed(2));
    const marginEgp = Number((netSystemRev - costEgp).toFixed(2));
    const marginPct = netSystemRev > 0 ? Math.round((marginEgp / netSystemRev) * 100) : (costEgp > 0 ? -100 : 100);

    totalCostUsd += costUsd;
    totalCostEgp += costEgp;
    totalCalls += stats.textCalls + stats.images + stats.videos;
    totalNetSystemRevenueEgp += netSystemRev;

    perBrand.push({
      brandId: k,
      brandName: String(b?.name || (k === "system" ? "نظام المنصة العام" : k)),
      planId: String(b?.planId || (subPrice >= 5000 ? "growth_5000" : "trial_7d")),
      subscriptionEgp: subPrice,
      netSystemRevenueEgp: netSystemRev,
      textAndAgentCalls: stats.textCalls,
      imagesGenerated: stats.images,
      videosGenerated: stats.videos,
      totalAiCostUsd: costUsd,
      totalAiCostEgp: costEgp,
      netMarginEgp: marginEgp,
      netMarginPct: marginPct,
    });
  }

  perBrand.sort((a, b) => b.totalAiCostEgp - a.totalAiCostEgp || b.subscriptionEgp - a.subscriptionEgp);

  return {
    windowDays: days,
    usdToEgpRate: rate,
    totals: {
      totalCostUsd: Number(totalCostUsd.toFixed(4)),
      totalCostEgp: Number(totalCostEgp.toFixed(2)),
      totalCalls,
      totalNetSystemRevenueEgp,
    },
    perBrand,
  };
}
