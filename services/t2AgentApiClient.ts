/**
 * Complete Enterprise REST Client for T2 AI Agent Enterprise
 * Connects Ez-Zel / Jarvis Brain directly to T2 AI Agent (WhatsApp, Meta, TikTok, CRM, Broadcasts, Payments).
 */
import crypto from "crypto";

const DEFAULT_T2_AGENT_URL = "https://agent.t2os.app";

export function signT2AgentSsoToken(params: {
  brandId: string;
  email?: string;
  isMaster?: boolean;
  ttlMs?: number;
}): string {
  const secret = (process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || process.env.ADMIN_API_SECRET || "").trim();
  if (!secret) return "";
  const payload = Buffer.from(
    JSON.stringify({
      scope: "t2_agent_sso",
      brandId: params.brandId || "clean_master",
      email: (params.email || (params.isMaster ? "ahm.atya@gmail.com" : "")).trim().toLowerCase(),
      isMaster: Boolean(params.isMaster),
      exp: Date.now() + (params.ttlMs || 10 * 60 * 1000),
    }),
    "utf8"
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `t2sso_${payload}.${sig}`;
}

export function getT2AgentBaseUrl(): string {
  return (
    process.env.T2_AGENT_API_URL || DEFAULT_T2_AGENT_URL
  ).replace(/\/+$/, "");
}

async function agentRequest<T = any>(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  body?: any,
  query?: Record<string, string | undefined>
): Promise<T> {
  const baseUrl = getT2AgentBaseUrl();
  const url = new URL(`${baseUrl}${endpoint}`);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const adminKey = process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY;
  if (adminKey) {
    headers["x-admin-key"] = adminKey;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(8000),
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(text)) {
    throw new Error(
      `T2 AI Agent API returned an HTML page instead of JSON for ${method} ${endpoint}. ` +
        `Deploy T2 AI Agent to Render/public URL and set T2_AGENT_API_URL.`
    );
  }

  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `T2 Agent API ${res.status}`);
  }
  return data as T;
}

export const t2AgentApi = {
  // System & Master Admin
  getSystemHealth: () => agentRequest("GET", "/api/system/health"),
  getAllBrandsHealth: () => agentRequest("GET", "/api/admin/brands/health"),
  getFinancialsSummary: () => agentRequest("GET", "/api/admin/financials-summary"),

  // Brand Status & WhatsApp Connection
  getBrandStatus: (brandId: string) =>
    agentRequest("GET", `/api/brands/${encodeURIComponent(brandId)}/status`),
  requestPairingCode: (brandId: string, phoneNumber: string) =>
    agentRequest("POST", `/api/brands/${encodeURIComponent(brandId)}/pair-phone`, {
      phoneNumber,
    }),
  togglePauseBot: (brandId: string) =>
    agentRequest("POST", `/api/brands/${encodeURIComponent(brandId)}/toggle-pause`, {}),

  // Unified CRM, Bookings & Financials
  getConversations: (brandId: string) =>
    agentRequest("GET", `/api/brands/${encodeURIComponent(brandId)}/conversations`),
  getCustomers: (brandId: string) =>
    agentRequest("GET", `/api/brands/${encodeURIComponent(brandId)}/customers`),
  getBookings: (brandId: string) =>
    agentRequest("GET", `/api/brands/${encodeURIComponent(brandId)}/bookings`),
  getBrandFinancials: (brandId: string) =>
    agentRequest("GET", `/api/brands/${encodeURIComponent(brandId)}/analytics-financials`),
  sendManualReply: (brandId: string, phone: string, message: string) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/customers/${encodeURIComponent(phone)}/reply`,
      { message }
    ),
  setHandover: (brandId: string, phone: string, isHandover: boolean) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/customers/${encodeURIComponent(phone)}/handover`,
      { isHandover }
    ),

  // Broadcasts & Re-engagement
  startWhatsAppBroadcast: (brandId: string, payload: any) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/broadcast/start`,
      payload
    ),
  triggerReEngagement: (brandId: string, phone = "all", customMessage?: string) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/re-engagement/trigger-now`,
      { phone, customMessage }
    ),

  // Instant Payment Link & Catalog / Crawler
  generatePaymentLink: (
    brandId: string,
    payload: {
      customerPhone: string;
      customerName?: string;
      serviceName: string;
      amount: number;
      depositAmount?: number;
      notes?: string;
    }
  ) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/payments/generate-link`,
      payload
    ),
  startVirtualCrawler: (brandId: string, targetUrl: string, autoApply = true) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/virtual-crawler/start`,
      { targetUrl, autoApply }
    ),
  correctPlaygroundReply: (
    brandId: string,
    question: string,
    botReply: string,
    correctedAnswer: string
  ) =>
    agentRequest(
      "POST",
      `/api/brands/${encodeURIComponent(brandId)}/playground/correct`,
      { question, botReply, correctedAnswer }
    ),

  // --- External Action API v1 & Embed Windows (16 Sections / 107 Operations / 29 Embed Windows) ---
  getExternalCatalog: () => agentRequest("GET", "/api/external/v1/catalog"),
  getBrandKeys: (brandId: string) =>
    agentRequest("GET", `/api/external/v1/brands/${encodeURIComponent(brandId)}/keys`),
  rotateBrandKeys: (brandId: string) =>
    agentRequest("POST", `/api/external/v1/brands/${encodeURIComponent(brandId)}/keys/rotate`, {}),
  executeExternalAction: (
    brandId: string,
    section: string,
    action: string,
    payload: Record<string, any> = {}
  ) => agentRequest("POST", "/api/external/v1/execute", { brandId, section, action, payload }),
  executeExternalAdminAction: (action: string, payload: Record<string, any> = {}) =>
    agentRequest("POST", `/api/external/v1/admin/actions/${encodeURIComponent(action)}`, payload),
  getExternalWindowData: (brandId: string, windowName: string) =>
    agentRequest("GET", `/api/external/v1/brands/${encodeURIComponent(brandId)}/windows/${encodeURIComponent(windowName)}`),
  buildAgentEmbedUrl: (windowName: string, brandId: string, apiKey?: string, ssoToken?: string) => {
    const base = getT2AgentBaseUrl();
    const qs = new URLSearchParams({ brandId: brandId || "clean_master", embed: "1" });
    if (ssoToken) qs.set("ssoToken", ssoToken);
    else if (apiKey) qs.set("apiKey", apiKey);
    return `${base}/embed/${encodeURIComponent(windowName || "crm")}?${qs.toString()}`;
  },
  buildAgentFullDashboardUrl: (brandId: string, ssoToken?: string) => {
    const base = getT2AgentBaseUrl();
    const qs = new URLSearchParams({ brandId: brandId || "clean_master" });
    if (ssoToken) qs.set("ssoToken", ssoToken);
    return `${base}/dashboard?${qs.toString()}`;
  },
};
