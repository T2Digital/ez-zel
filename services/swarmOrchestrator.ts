import { getEzZelPersonalClients, getUnifiedGrowthBrands } from './obsidianVaultService';
import { mirrorStateToFirestore, restoreStateFromFirestore } from './persistentStorage';
import { getLiveTelemetrySummary } from './liveTelemetryService';
import { buildFlagshipTenantUrl } from './tenantAppRenderer';

export type SwarmRole = 'MASTER_ADMIN' | 'BRAND_OWNER' | 'VISITOR';

export interface SwarmAgentReport {
  id: 'brand_architect' | 'app_provisioner' | 'social_studio' | 'whatsapp_sales' | 'executive_cfo';
  name: string;
  roleTitle: string;
  status: 'done' | 'active' | 'pending' | 'needs_action';
  summary: string;
  metric?: string;
  actionLabel?: string;
  actionUrl?: string;
}

export interface JarvisSwarmResult {
  ok: boolean;
  role: SwarmRole;
  brandId?: string;
  brandName?: string;
  executedAt: string;
  latencyMs: number;
  agents: SwarmAgentReport[];
  executiveSummary: {
    hasBrand: boolean;
    logoUrl?: string;
    slogan?: string;
    appUrl?: string;
    appTemplate?: string;
    whatsappConnected: boolean;
    connectedSocials: string[];
    totalSocialSlots: number;
    studioPostsCount: number;
    trialDaysLeft: number | null;
    subscriptionStatus: string;
    totalBrandsCount?: number;
    totalSubscribersCount?: number;
    activeTrialsCount?: number;
  };
}

export interface CloudMemoryRecord {
  scopeKey: string;
  rollingSummary: string;
  facts: string[];
  preferences: string[];
  updatedAt: string;
}

const memoryCache = new Map<string, CloudMemoryRecord>();

function normalizeScopeKey(scopeKey: string): string {
  return String(scopeKey || 'guest')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '_')
    .slice(0, 80) || 'guest';
}

export async function loadCloudMemory(rawScopeKey: string): Promise<CloudMemoryRecord> {
  const scopeKey = normalizeScopeKey(rawScopeKey);
  const cached = memoryCache.get(scopeKey);
  if (cached) return cached;

  const restored = await restoreStateFromFirestore<CloudMemoryRecord>(`jarvis_memory_${scopeKey}`).catch(() => null);
  if (restored) {
    memoryCache.set(scopeKey, restored);
    return restored;
  }

  const empty: CloudMemoryRecord = {
    scopeKey,
    rollingSummary: '',
    facts: [],
    preferences: [],
    updatedAt: new Date().toISOString()
  };
  memoryCache.set(scopeKey, empty);
  return empty;
}

export async function saveCloudMemory(
  rawScopeKey: string,
  patch: Partial<Pick<CloudMemoryRecord, 'rollingSummary' | 'facts' | 'preferences'>>
): Promise<CloudMemoryRecord> {
  const scopeKey = normalizeScopeKey(rawScopeKey);
  const current = await loadCloudMemory(scopeKey);
  const mergedFacts = Array.from(new Set([...(current.facts || []), ...(patch.facts || [])])).slice(-25);
  const mergedPrefs = Array.from(new Set([...(current.preferences || []), ...(patch.preferences || [])])).slice(-20);

  const next: CloudMemoryRecord = {
    scopeKey,
    rollingSummary: patch.rollingSummary !== undefined ? patch.rollingSummary : current.rollingSummary,
    facts: mergedFacts,
    preferences: mergedPrefs,
    updatedAt: new Date().toISOString()
  };

  memoryCache.set(scopeKey, next);
  mirrorStateToFirestore(`jarvis_memory_${scopeKey}`, next).catch(() => {});
  return next;
}

const ALL_SOCIAL_PLATFORMS = ['facebook', 'instagram', 'tiktok', 'youtube', 'telegram', 'x', 'linkedin', 'snapchat'];

function computeTrialDaysLeft(trialEndsAt?: string): number | null {
  if (!trialEndsAt) return null;
  const endMs = new Date(trialEndsAt).getTime();
  if (Number.isNaN(endMs)) return null;
  return Math.max(0, Math.ceil((endMs - Date.now()) / 86400000));
}

/**
 * Runs all 5 Jarvis Swarm specialist agents in parallel and returns
 * a real, role-scoped operational snapshot without fake fallback metrics.
 */
export async function runJarvisSwarm(input: {
  role?: SwarmRole;
  brandId?: string;
  phone?: string;
  intent?: string;
}): Promise<JarvisSwarmResult> {
  const startedAt = Date.now();
  const role: SwarmRole = input.role || 'VISITOR';
  const brands = getUnifiedGrowthBrands();
  const clients = getEzZelPersonalClients();

  const normalizedPhone = String(input.phone || '').replace(/\D+/g, '');
  const targetBrand =
    (input.brandId && brands.find((b: any) => b.id === input.brandId || b.slug === input.brandId)) ||
    (normalizedPhone && brands.find((b: any) => String(b.phone || '').replace(/\D+/g, '').endsWith(normalizedPhone.slice(-9)))) ||
    (role === 'MASTER_ADMIN' ? brands[0] : null);

  const linkedClient = targetBrand
    ? clients.find((c: any) => c.linkedBrandId === targetBrand.id)
    : (normalizedPhone ? clients.find((c: any) => String(c.phone || '').replace(/\D+/g, '').endsWith(normalizedPhone.slice(-9))) : null);

  const socialLinksObj: Record<string, string> = (targetBrand as any)?.socialLinks || {};
  const connectedSocials = ALL_SOCIAL_PLATFORMS.filter((p) => {
    if (p === 'facebook' && (targetBrand as any)?.metaPageId) return true;
    if (p === 'instagram' && (targetBrand as any)?.instagramUsername) return true;
    return Boolean(socialLinksObj[p]);
  });

  const studioPostsCount = Array.isArray(targetBrand?.weekContentPlan) ? targetBrand.weekContentPlan.length : 0;
  const resolvedAppUrl = targetBrand
    ? ((targetBrand as any)?.appMode === 'existing_site' && targetBrand.websiteUrl
        ? targetBrand.websiteUrl
        : buildFlagshipTenantUrl(targetBrand.slug || targetBrand.id, (targetBrand as any)?.appTemplate || 'services_booking'))
    : undefined;

  const trialDaysLeft = computeTrialDaysLeft(linkedClient?.trialEndsAt);
  const telemetry = getLiveTelemetrySummary(role === 'MASTER_ADMIN' ? undefined : targetBrand?.id);

  // Execute all 5 specialist agents concurrently
  const [brandAgent, appAgent, socialAgent, waAgent, cfoAgent] = await Promise.all([
    Promise.resolve<SwarmAgentReport>({
      id: 'brand_architect',
      name: 'وكيل الهوية والاستراتيجية',
      roleTitle: 'Brand Architect',
      status: targetBrand ? 'done' : 'needs_action',
      summary: targetBrand
        ? `هوية "${targetBrand.name}" معتمدة${(targetBrand as any).slogan ? ` (${(targetBrand as any).slogan})` : ''}${(targetBrand as any).dedicatedLiveUrl ? ` • رابط مستقل: ${(targetBrand as any).dedicatedLiveUrl}` : ''}.`
        : 'جاهز لابتكار الاسم والسلوجان واللوجو أو استيعاب هويتك الحالية.',
      metric: targetBrand?.businessType || 'بانتظار تحديد النشاط'
    }),
    Promise.resolve<SwarmAgentReport>({
      id: 'app_provisioner',
      name: 'وكيل التطبيقات والكتالوج',
      roleTitle: 'App Provisioner',
      status: resolvedAppUrl ? 'done' : 'needs_action',
      summary: resolvedAppUrl
        ? `التطبيق مفعّل (${(targetBrand as any)?.appTemplate === 'products_erp' ? 'متجر + ERP/POS' : 'خدمات + حجوزات'}). طلبات/حجوزات لايف: ${telemetry.orders + telemetry.bookings}.`
        : 'جاهز لتفعيل نسخة تطبيق بطاح أو كلين ماستر أو ربط موقعك الحالي.',
      metric: `${telemetry.orders} طلب | ${telemetry.bookings} حجز`,
      actionLabel: resolvedAppUrl ? 'فتح التطبيق' : undefined,
      actionUrl: (targetBrand as any)?.dedicatedLiveUrl || resolvedAppUrl
    }),
    Promise.resolve<SwarmAgentReport>({
      id: 'social_studio',
      name: 'وكيل السوشيال والمحتوى',
      roleTitle: 'Omni-Social Studio',
      status: connectedSocials.length > 0 || studioPostsCount > 0 || telemetry.socialInteractions > 0 ? 'active' : 'pending',
      summary:
        `مربوط بـ ${connectedSocials.length}/8 منصات • ${studioPostsCount} منشور ستوديو • ${telemetry.socialInteractions} تفاعل لايف (لايك/كومنت/رسالة).`,
      metric: `${connectedSocials.length}/8 منصات | ${telemetry.socialInteractions} تفاعل`
    }),
    Promise.resolve<SwarmAgentReport>({
      id: 'whatsapp_sales',
      name: 'وكيل الواتساب والمبيعات',
      roleTitle: 'T2 WhatsApp Agent',
      status: (targetBrand as any)?.whatsappConnected || targetBrand?.phone || telemetry.whatsappMessages > 0 ? 'active' : 'pending',
      summary: targetBrand?.phone
        ? `واتساب (${targetBrand.phone}): ${telemetry.whatsappMessages} رسالة واردة، و${telemetry.whatsappConfirmed} حجز/بيع مؤكد عبر الواتساب.`
        : `رسائل واتساب لايف: ${telemetry.whatsappMessages} | حجوزات مؤكدة: ${telemetry.whatsappConfirmed}.`,
      metric: `${telemetry.whatsappMessages} رسالة | ${telemetry.whatsappConfirmed} مؤكد`
    }),
    Promise.resolve<SwarmAgentReport>(
      role === 'MASTER_ADMIN'
        ? {
            id: 'executive_cfo',
            name: 'الوكيل المالي والتنفيذي',
            roleTitle: 'Master Executive CFO',
            status: 'done',
            summary: `${brands.length} براند | ${clients.length} مشترك (${clients.filter((c: any) => c.status === 'trial').length} تجربة) | إيراد لايف: ${telemetry.totalRevenueEgp} ج.م | ${telemetry.totalEvents} حدث حي.`,
            metric: `${telemetry.totalRevenueEgp} ج.م | ${telemetry.orders + telemetry.bookings} عملية`
          }
        : {
            id: 'executive_cfo',
            name: 'وكيل الباقة والنمو',
            roleTitle: 'Growth & Plan Agent',
            status: linkedClient ? 'active' : 'pending',
            summary: linkedClient
              ? `الباقة: ${linkedClient.plan || linkedClient.status}${trialDaysLeft !== null ? ` (متبقي ${trialDaysLeft} يوم)` : ''} • إيراد لايف: ${telemetry.totalRevenueEgp} ج.م.`
              : 'مؤهل لتفعيل تجربة مجانية كاملة لمدة 7 أيام بدون التزام.',
            metric: trialDaysLeft !== null ? `${trialDaysLeft} يوم | ${telemetry.totalRevenueEgp} ج.م` : `${telemetry.totalRevenueEgp} ج.م`
          }
    )
  ]);

  const activeTrialsCount = clients.filter((c: any) => c.status === 'trial').length;

  return {
    ok: true,
    role,
    brandId: targetBrand?.id,
    brandName: targetBrand?.name,
    executedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
    agents: [brandAgent, appAgent, socialAgent, waAgent, cfoAgent],
    executiveSummary: {
      hasBrand: Boolean(targetBrand),
      logoUrl: (targetBrand as any)?.logoUrl || undefined,
      slogan: (targetBrand as any)?.slogan || undefined,
      appUrl: resolvedAppUrl,
      appTemplate: (targetBrand as any)?.appTemplate,
      whatsappConnected: Boolean((targetBrand as any)?.whatsappConnected),
      connectedSocials,
      totalSocialSlots: ALL_SOCIAL_PLATFORMS.length,
      studioPostsCount,
      trialDaysLeft,
      subscriptionStatus: linkedClient?.status || (targetBrand ? 'trial' : 'visitor'),
      ...(role === 'MASTER_ADMIN'
        ? {
            totalBrandsCount: brands.length,
            totalSubscribersCount: Array.isArray(stats?.paymobSubscriptions) ? stats.paymobSubscriptions.length : 0,
            activeTrialsCount
          }
        : {})
    }
  };
}
