import React, { useEffect, useRef, useState } from 'react';
import { Bell, ShoppingBag, CalendarCheck, MessageCircle, Heart, X, Sparkles } from 'lucide-react';

interface LiveEventItem {
  id: string;
  source: string;
  eventType: string;
  brandId: string;
  customerName?: string;
  customerPhone?: string;
  amountEgp?: number;
  summary: string;
  timestamp: string;
}

interface LiveTelemetryNotifierProps {
  isMasterAdmin?: boolean;
  activeBrandId?: string;
}

function playLuxuryPing() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  } catch {}
}

export const LiveTelemetryNotifier: React.FC<LiveTelemetryNotifierProps> = ({
  isMasterAdmin = false,
  activeBrandId
}) => {
  const [toasts, setToasts] = useState<LiveEventItem[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());

  const pushToast = (ev: LiveEventItem) => {
    if (!ev?.id || seenIdsRef.current.has(ev.id)) return;
    if (!isMasterAdmin && activeBrandId && ev.brandId !== activeBrandId) return;
    if (!isMasterAdmin && !activeBrandId) return;

    seenIdsRef.current.add(ev.id);
    setToasts((prev) => [ev, ...prev].slice(0, 4));
    playLuxuryPing();

    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      try {
        new Notification('إشعار حي من منظومة الظل ⚡', {
          body: ev.summary,
          icon: '/favicon.ico'
        });
      } catch {}
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== ev.id));
    }, 7000);
  };

  useEffect(() => {
    if (!isMasterAdmin && !activeBrandId) return;

    let ws: WebSocket | null = null;
    let pollTimer: any = null;
    let initialLoad = true;

    const fetchLatest = async () => {
      try {
        const url = isMasterAdmin
          ? '/api/telemetry/live'
          : `/api/telemetry/live?brandId=${encodeURIComponent(activeBrandId || '')}`;
        const res = await fetch(url);
        const data = await res.json();
        const list: LiveEventItem[] = Array.isArray(data?.latestEvents) ? data.latestEvents : [];
        if (initialLoad) {
          list.forEach((ev) => seenIdsRef.current.add(ev.id));
          initialLoad = false;
          return;
        }
        list.slice(0, 3).reverse().forEach(pushToast);
      } catch {}
    };

    fetchLatest();
    pollTimer = setInterval(fetchLatest, 15000);

    try {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/gateway`);
      ws.onmessage = (msg) => {
        try {
          const parsed = JSON.parse(msg.data);
          if (parsed?.event === 'LIVE_TELEMETRY_EVENT' && parsed?.payload) {
            pushToast(parsed.payload);
          }
        } catch {}
      };
    } catch {}

    return () => {
      if (pollTimer) clearInterval(pollTimer);
      try { ws?.close(); } catch {}
    };
  }, [isMasterAdmin, activeBrandId]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 left-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none font-['Cairo']" dir="rtl">
      {toasts.map((t) => {
        const isMoney = t.eventType === 'order_created' || t.eventType === 'whatsapp_sale';
        const isBooking = t.eventType === 'booking_created' || t.eventType === 'whatsapp_booking';
        const isWa = t.eventType === 'whatsapp_message';
        const Icon = isMoney ? ShoppingBag : isBooking ? CalendarCheck : isWa ? MessageCircle : Heart;
        const borderCls = isMoney
          ? 'border-emerald-400/60 bg-emerald-950/90'
          : isBooking
          ? 'border-cyan-400/60 bg-cyan-950/90'
          : isWa
          ? 'border-teal-400/60 bg-slate-950/95'
          : 'border-purple-400/60 bg-purple-950/90';

        return (
          <div
            key={t.id}
            className={`pointer-events-auto p-3 rounded-2xl border ${borderCls} backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.55)] flex items-start gap-2.5 animate-in slide-in-from-left`}
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center shrink-0 text-white">
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black text-amber-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> حدث حي الآن • {t.brandId}
                </span>
                <button
                  type="button"
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs font-bold text-white mt-0.5 leading-snug">{t.summary}</p>
              {Number(t.amountEgp || 0) > 0 && (
                <div className="text-[11px] font-black text-emerald-300 mt-1">💰 القيمة: {t.amountEgp} ج.م</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
