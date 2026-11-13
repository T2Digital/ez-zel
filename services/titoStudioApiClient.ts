/**
 * Complete Enterprise REST Client for Tito Studio v3.0 (49 Endpoints)
 * Connects Ez-Zel / Jarvis Brain directly to Tito Studio Cloud Run API.
 */

const DEFAULT_TITO_STUDIO_URL =
  "https://ais-dev-igm22i3xu3wcsk2bcajmfa-532986182743.europe-west2.run.app";

export function getTitoStudioBaseUrl(): string {
  return (
    process.env.TITO_STUDIO_API_URL || DEFAULT_TITO_STUDIO_URL
  ).replace(/\/+$/, "");
}

async function studioRequest<T = any>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  endpoint: string,
  body?: any,
  query?: Record<string, string | undefined>
): Promise<T> {
  const baseUrl = getTitoStudioBaseUrl();
  const url = new URL(`${baseUrl}${endpoint}`);

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, v);
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (process.env.TITO_STUDIO_API_KEY) {
    headers["x-api-key"] = process.env.TITO_STUDIO_API_KEY;
  }

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined && method !== "GET" ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("text/html") || /^\s*<!doctype html/i.test(text)) {
    throw new Error(
      `Tito Studio API returned an HTML page instead of JSON for ${method} ${endpoint}. ` +
        `The URL (${baseUrl}) is likely an AI Studio dev preview behind a Google login/cookie check. ` +
        `Deploy Tito Studio to a public Cloud Run URL and set TITO_STUDIO_API_URL.`
    );
  }
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    throw new Error(
      data?.error || data?.message || `Tito Studio API ${method} ${endpoint} failed (${res.status})`
    );
  }
  return data as T;
}

export const titoStudioApi = {
  // --- 1. Brands & Branding ---
  listBrands: () => studioRequest("GET", "/api/brands"),
  getBrand: (id: string) => studioRequest("GET", `/api/brands/${encodeURIComponent(id)}`),
  createBrand: (payload: {
    name: string;
    industry?: string;
    dialect?: string;
    primaryColor?: string;
    phone?: string;
    description?: string;
    [k: string]: any;
  }) => studioRequest("POST", "/api/brands", payload),
  updateBrand: (id: string, payload: Record<string, any>) =>
    studioRequest("PATCH", `/api/brands/${encodeURIComponent(id)}`, payload),
  generateBrandKit: (payload: {
    brandName: string;
    industry: string;
    currentDescription?: string;
    dialect?: string;
  }) => studioRequest("POST", "/api/brand/generateKit", payload),

  // --- 2. Content, Calendar & 30-Day Recycle ---
  listContent: (clinicId?: string, status?: string) =>
    studioRequest("GET", "/api/content", undefined, { clinicId, status }),
  createContent: (payload: {
    clinicId: string;
    title: string;
    type?: string;
    caption: string;
    visualUrl?: string;
    status?: string;
    date?: string;
    scheduledPlatforms?: string[];
  }) => studioRequest("POST", "/api/content", payload),
  updateContent: (id: string, payload: Record<string, any>) =>
    studioRequest("PATCH", `/api/content/${encodeURIComponent(id)}`, payload),
  deleteContent: (id: string) =>
    studioRequest("DELETE", `/api/content/${encodeURIComponent(id)}`),
  recycleContent: (id: string, daysAhead = 30, platforms = ["instagram", "facebook"]) =>
    studioRequest("POST", `/api/content/${encodeURIComponent(id)}/recycle`, {
      daysAhead,
      platforms,
    }),
  processScheduledPosts: () => studioRequest("POST", "/api/cron/process-scheduled-posts", {}),

  // --- 3. Ideas Bank & Appointments ---
  listIdeas: (clinicId: string) =>
    studioRequest("GET", "/api/ideas", undefined, { clinicId }),
  createIdea: (payload: {
    clinicId: string;
    title: string;
    description?: string;
    type?: string;
    pillar?: string;
  }) => studioRequest("POST", "/api/ideas", payload),
  listAppointments: (clinicId: string) =>
    studioRequest("GET", "/api/appointments", undefined, { clinicId }),
  createAppointment: (payload: {
    clinicId: string;
    patientName: string;
    phone: string;
    service: string;
    date?: string;
    time?: string;
    status?: string;
  }) => studioRequest("POST", "/api/appointments", payload),
  updateAppointment: (id: string, payload: { status?: string; notes?: string; [k: string]: any }) =>
    studioRequest("PATCH", `/api/appointments/${encodeURIComponent(id)}`, payload),

  // --- 4. Meta Pages & Ads ---
  getMetaPages: (accessToken?: string) =>
    studioRequest("GET", "/api/meta/pages", undefined, { accessToken }),
  createMetaPage: (payload: Record<string, any>) =>
    studioRequest("POST", "/api/meta/pages/create", payload),
  linkInstagram: (payload: { accessToken?: string; pageId: string; igUserId?: string }) =>
    studioRequest("POST", "/api/meta/pages/link-instagram", payload),
  getMetaAdAccounts: (accessToken?: string) =>
    studioRequest("GET", "/api/meta/ads/accounts", undefined, { accessToken }),
  generateMetaAdCampaign: (payload: {
    campaignName: string;
    objective?: string;
    dailyBudget?: number;
    currency?: string;
    targetAudience?: string;
    offerDetails?: string;
    dialect?: string;
    clinicId?: string;
  }) => studioRequest("POST", "/api/meta/ads/generate", payload),
  listMetaCampaigns: (clinicId: string) =>
    studioRequest("GET", "/api/meta/ads/campaigns", undefined, { clinicId }),
  createMetaAdCampaign: (payload: Record<string, any>) =>
    studioRequest("POST", "/api/meta/ads/campaigns/create", payload),
  setMetaCampaignStatus: (payload: {
    accessToken?: string;
    docId?: string;
    metaCampaignId?: string;
    status: "ACTIVE" | "PAUSED";
  }) => studioRequest("POST", "/api/meta/ads/campaigns/status", payload),
  getMetaInsights: (campaignId: string, accessToken?: string) =>
    studioRequest("GET", "/api/meta/ads/insights", undefined, { campaignId, accessToken }),

  // --- 5. Multi-Platform Publishing & Comments ---
  publishMeta: (payload: {
    accessToken?: string;
    pageId?: string;
    mediaUrl?: string;
    caption: string;
    mediaType?: "IMAGE" | "VIDEO";
    platform?: "facebook" | "instagram" | "both";
  }) => studioRequest("POST", "/api/meta/publish", payload),
  getMetaComments: (pageId: string, platform = "instagram", accessToken?: string) =>
    studioRequest("GET", "/api/meta/comments", undefined, { pageId, platform, accessToken }),
  replyMetaComment: (payload: {
    accessToken?: string;
    commentId: string;
    message: string;
    platform?: string;
  }) => studioRequest("POST", "/api/meta/reply", payload),
  publishTikTok: (payload: {
    clinicId: string;
    videoUrl: string;
    title: string;
    caption?: string;
    privacyLevel?: string;
  }) => studioRequest("POST", "/api/tiktok/publish", payload),
  publishYouTube: (payload: {
    clinicId: string;
    videoUrl: string;
    title: string;
    description?: string;
  }) => studioRequest("POST", "/api/youtube/publish", payload),
  publishSnapchat: (payload: { clinicId: string; mediaUrl: string; caption?: string }) =>
    studioRequest("POST", "/api/snapchat/publish", payload),
  publishX: (payload: { clinicId: string; caption: string }) =>
    studioRequest("POST", "/api/x/publish", payload),

  // --- 6. AI, Images, Veo 3D Video, TTS & Zain Copilot ---
  generateGeminiText: (contents: string, model = "gemini-3.1-flash-lite") =>
    studioRequest("POST", "/api/gemini/generateContent", { model, contents }),
  generateGeminiImage: (prompt: string, model = "gemini-3.1-flash-lite-image") =>
    studioRequest("POST", "/api/gemini/generateImages", { model, prompt }),
  startVeoVideo: (prompt: string, aspectRatio = "9:16", durationSeconds = 5) =>
    studioRequest("POST", "/api/gemini/generateVideos", {
      model: "veo-3.1-generate-preview",
      prompt,
      config: { aspectRatio, durationSeconds },
    }),
  checkVeoOperation: (operationName: string) =>
    studioRequest("POST", "/api/gemini/getVideosOperation", {
      operation: { name: operationName },
    }),
  downloadVeoVideo: (videoUri: string) =>
    studioRequest("POST", "/api/gemini/downloadVideo", { videoUri }),
  synthesizeStudioTts: (text: string, voiceName = "Puck", dialect = "egyptian") =>
    studioRequest("POST", "/api/tts", { text, voiceName, dialect }),
  zainCopilotChat: (message: string, brandContext?: any) =>
    studioRequest("POST", "/api/copilot/chat", { message, brandContext }),

  // --- 7. Autopilot & Virtual Browse ---
  runAutopilot: (clinicId: string) =>
    studioRequest("POST", "/api/autopilot/run", { clinicId }),
  runVirtualBrowse: (clinicId: string, queryFocus: string) =>
    studioRequest("POST", "/api/autopilot/virtual-browse", { clinicId, queryFocus }),

  // --- 8. Sales Radar & WhatsApp ---
  listLeads: (clinicId: string) =>
    studioRequest("GET", "/api/leads", undefined, { clinicId }),
  analyzeLeadComment: (payload: {
    comment: string;
    competitorContext?: string;
    clinic: { id: string; name: string; industry?: string; whatsappNumber?: string };
  }) => studioRequest("POST", "/api/leads/analyze", payload),
  spinLeadOffer: (payload: {
    personalizedOffer: string;
    user?: string;
    commentText?: string;
    clinic: { name: string; industry?: string };
  }) => studioRequest("POST", "/api/leads/spin", payload),
  sendStudioWhatsApp: (phone: string, message: string, providerSettings?: any) =>
    studioRequest("POST", "/api/whatsapp/send", {
      phone,
      message,
      providerSettings: providerSettings || { provider: "simulation" },
    }),

  // --- 9. Cloud Storage & Scraper ---
  uploadMediaAsset: (data: string, fileName: string) =>
    studioRequest("POST", "/api/upload", { data, fileName }),
  testStorageBucket: (storageConfig: Record<string, any>) =>
    studioRequest("POST", "/api/storage/test", { storageConfig }),
  scrapeUrlToBrand: (url: string, clinicId: string) =>
    studioRequest("POST", "/api/scrape", { url, clinicId }),

  // --- 10. Health Alerts ---
  sendAlertTest: (clinicId: string, message: string, type = "success") =>
    studioRequest("POST", "/api/alerts/test", { clinicId, message, type }),
};
