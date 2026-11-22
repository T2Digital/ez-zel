import { getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from './obsidianVaultService';
import { readPersistentJson, savePersistentJson } from './persistentStorage';

export type LiveEventSource =
  | 'battah'
  | 'clean_master'
  | 't2_agent_whatsapp'
  | 'meta_webhook'
  | 'paymob'
  | 't2_studio'
  | 'storefront_pixel';

export type LiveEventType =
  | 'order_created'
  | 'booking_created'
  | 'whatsapp_message'
  | 'whatsapp_booking'
  | 'whatsapp_sale'
  | 'meta_like'
  | 'meta_comment'
  | 'meta_message'
  | 'meta_lead'
  | 'store_visit'
  | 'product_view'
  | 'cart_add'
  | 'post_insights'
  | 'ad_insights'
  | 'showroom_ready'
  | 'content_approved';

export interface LiveTelemetryEvent {
  id: string;
  source: LiveEventSource;
  eventType: LiveEventType;
  brandId: string;
  customerName?: string;
  customerPhone?: string;
  amountEgp?: number;
  summary: string;
  raw?: any;
  timestamp: string;
}

const MAX_EVENTS = 500;

export function getLiveEvents(brandId?: string): LiveTelemetryEvent[] {
  const all = readPersistentJson<LiveTelemetryEvent[]>('live_events.json', []);
  if (!brandId) return all;
  const target = brandId.toLowerCase();
  return all.filter((e) => String(e.brandId || '').toLowerCase() === target);
}

export function recordLiveEvent(input: Omit<LiveTelemetryEvent, 'id' | 'timestamp'>): LiveTelemetryEvent {
  const event: LiveTelemetryEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    ...input,
    brandId: input.brandId || 'clean_master'
  };

  const all = readPersistentJson<LiveTelemetryEvent[]>('live_events.json', []);
  const next = [event, ...all].slice(0, MAX_EVENTS);
  savePersistentJson('live_events', 'live_events.json', next);

  // Update matching brand counters in real time (non-fatal if vault unavailable)
  try {
    const brands = getUnifiedGrowthBrands();
    const matched = brands.find(
      (b: any) =>
        b.id === event.brandId ||
        b.slug === event.brandId ||
        (input.raw?.pageId && (b as any).metaPageId === input.raw.pageId)
    );

    if (matched) {
      const m: any = matched;
      const isOrder = event.eventType === 'order_created' || event.eventType === 'whatsapp_sale';
      const isBooking = event.eventType === 'booking_created' || event.eventType === 'whatsapp_booking';
      const isWaMsg = event.eventType === 'whatsapp_message';
      const isWaConfirmed = event.eventType === 'whatsapp_booking' || event.eventType === 'whatsapp_sale';
      const isSocial = event.eventType.startsWith('meta_') || event.eventType === 'post_insights';
      const isVisit = event.eventType === 'store_visit';
      const isCart = event.eventType === 'cart_add';
      const amount = Number(event.amountEgp || 0);

      const recent = Array.isArray(m.recentLiveEvents) ? m.recentLiveEvents : [];

      persistBrandUpdateAcrossEcosystem(matched.id, {
        liveOrdersCount: (m.liveOrdersCount || 0) + (isOrder ? 1 : 0),
        liveBookingsCount: (m.liveBookingsCount || 0) + (isBooking ? 1 : 0),
        liveWhatsappMessagesCount: (m.liveWhatsappMessagesCount || 0) + (isWaMsg ? 1 : 0),
        liveWhatsappConfirmedCount: (m.liveWhatsappConfirmedCount || 0) + (isWaConfirmed ? 1 : 0),
        liveSocialInteractionsCount: (m.liveSocialInteractionsCount || 0) + (isSocial ? 1 : 0),
        liveStoreVisitsCount: (m.liveStoreVisitsCount || 0) + (isVisit ? 1 : 0),
        liveCartAddsCount: (m.liveCartAddsCount || 0) + (isCart ? 1 : 0),
        liveRevenueEgp: (m.liveRevenueEgp || 0) + (amount > 0 ? amount : 0),
        lastLiveEventAt: event.timestamp,
        recentLiveEvents: [
          {
            id: event.id,
            source: event.source,
            eventType: event.eventType,
            summary: event.summary,
            amountEgp: amount,
            timestamp: event.timestamp
          },
          ...recent
        ].slice(0, 20)
      } as any);
    }
  } catch {}

  return event;
}

export function getLiveTelemetrySummary(brandId?: string) {
  const events = getLiveEvents(brandId);
  const orders = events.filter((e) => e.eventType === 'order_created' || e.eventType === 'whatsapp_sale').length;
  const bookings = events.filter((e) => e.eventType === 'booking_created' || e.eventType === 'whatsapp_booking').length;
  const whatsappMessages = events.filter((e) => e.eventType === 'whatsapp_message').length;
  const whatsappConfirmed = events.filter((e) => e.eventType === 'whatsapp_booking' || e.eventType === 'whatsapp_sale').length;

  const storeVisits = events.filter((e) => e.eventType === 'store_visit').length;
  const productViews = events.filter((e) => e.eventType === 'product_view').length;
  const cartAdds = events.filter((e) => e.eventType === 'cart_add').length;
  const cartToOrderRatePct = cartAdds > 0 ? Math.min(100, Math.round((orders / cartAdds) * 100)) : 0;

  let socialReach = 0;
  let socialViews = 0;
  let socialLikes = events.filter((e) => e.eventType === 'meta_like').length;
  let socialComments = events.filter((e) => e.eventType === 'meta_comment').length;

  let adSpendEgp = 0;
  let adClicks = 0;
  let adImpressions = 0;
  let adLeads = events.filter((e) => e.eventType === 'meta_lead').length;

  let showroomPendingCount = 0;
  let approvedContentCount = 0;

  for (const e of events) {
    if (e.eventType === 'post_insights' && e.raw) {
      socialReach += Number(e.raw.reach || 0);
      socialViews += Number(e.raw.views || e.raw.impressions || 0);
      socialLikes += Number(e.raw.likes || 0);
      socialComments += Number(e.raw.comments || 0);
    } else if (e.eventType === 'ad_insights' && e.raw) {
      adSpendEgp += Number(e.raw.spendEgp ?? e.raw.spend ?? 0);
      adClicks += Number(e.raw.clicks || 0);
      adImpressions += Number(e.raw.impressions || 0);
      adLeads += Number(e.raw.leads || e.raw.results || 0);
    } else if (e.eventType === 'showroom_ready') {
      showroomPendingCount += Number(e.raw?.approvedCount || 1);
    } else if (e.eventType === 'content_approved') {
      approvedContentCount += 1;
    }
  }

  const socialInteractions =
    events.filter((e) => e.eventType.startsWith('meta_')).length + socialLikes + socialComments;
  const totalRevenueEgp = events.reduce((acc, e) => acc + (Number(e.amountEgp) || 0), 0);

  const executivePulseAr =
    `النبض الحي للمنظومة: ${socialReach.toLocaleString('en-US')} وصول و${socialViews.toLocaleString('en-US')} مشاهدة، ` +
    `${socialLikes} لايك و${socialComments} تعليق، ` +
    `${storeVisits} زيارة متجر و${cartAdds} سلة و${orders} أوردر (${bookings} حجز)، ` +
    `${whatsappMessages} رسالة واتساب (${whatsappConfirmed} مؤكدة)، ` +
    `وإيراد مسجل ${totalRevenueEgp.toLocaleString('en-US')} ج.م` +
    (showroomPendingCount > 0 ? ` — ويوجد ${showroomPendingCount} منشورات في الشو روم بانتظار المراجعة.` : '.');

  return {
    totalEvents: events.length,
    orders,
    bookings,
    whatsappMessages,
    whatsappConfirmed,
    storeVisits,
    productViews,
    cartAdds,
    cartToOrderRatePct,
    socialReach,
    socialViews,
    socialLikes,
    socialComments,
    socialInteractions,
    adSpendEgp,
    adClicks,
    adImpressions,
    adLeads,
    showroomPendingCount,
    approvedContentCount,
    totalRevenueEgp,
    executivePulseAr,
    latestEvents: events.slice(0, 10)
  };
}
