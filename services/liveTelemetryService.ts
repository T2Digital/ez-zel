import { getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from './obsidianVaultService';
import { readPersistentJson, savePersistentJson } from './persistentStorage';

export type LiveEventSource = 'battah' | 'clean_master' | 't2_agent_whatsapp' | 'meta_webhook' | 'paymob';

export type LiveEventType =
  | 'order_created'
  | 'booking_created'
  | 'whatsapp_message'
  | 'whatsapp_booking'
  | 'whatsapp_sale'
  | 'meta_like'
  | 'meta_comment'
  | 'meta_message'
  | 'meta_lead';

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

  // Update matching brand counters in real time
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
    const isSocial = event.eventType.startsWith('meta_');
    const amount = Number(event.amountEgp || 0);

    const recent = Array.isArray(m.recentLiveEvents) ? m.recentLiveEvents : [];

    persistBrandUpdateAcrossEcosystem(matched.id, {
      liveOrdersCount: (m.liveOrdersCount || 0) + (isOrder ? 1 : 0),
      liveBookingsCount: (m.liveBookingsCount || 0) + (isBooking ? 1 : 0),
      liveWhatsappMessagesCount: (m.liveWhatsappMessagesCount || 0) + (isWaMsg ? 1 : 0),
      liveWhatsappConfirmedCount: (m.liveWhatsappConfirmedCount || 0) + (isWaConfirmed ? 1 : 0),
      liveSocialInteractionsCount: (m.liveSocialInteractionsCount || 0) + (isSocial ? 1 : 0),
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

  return event;
}

export function getLiveTelemetrySummary(brandId?: string) {
  const events = getLiveEvents(brandId);
  const orders = events.filter((e) => e.eventType === 'order_created' || e.eventType === 'whatsapp_sale').length;
  const bookings = events.filter((e) => e.eventType === 'booking_created' || e.eventType === 'whatsapp_booking').length;
  const whatsappMessages = events.filter((e) => e.eventType === 'whatsapp_message').length;
  const whatsappConfirmed = events.filter((e) => e.eventType === 'whatsapp_booking' || e.eventType === 'whatsapp_sale').length;
  const socialInteractions = events.filter((e) => e.eventType.startsWith('meta_')).length;
  const totalRevenueEgp = events.reduce((acc, e) => acc + (Number(e.amountEgp) || 0), 0);

  return {
    totalEvents: events.length,
    orders,
    bookings,
    whatsappMessages,
    whatsappConfirmed,
    socialInteractions,
    totalRevenueEgp,
    latestEvents: events.slice(0, 10)
  };
}
