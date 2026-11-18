# T2OS Sovereign Ecosystem — Unified System Map (`SYSTEM_MAP.md`)

مرجع معماري موحد يجمع الأركان الأربعة للمنظومة بدون تشتيت أو ازدواجية مصادر.

## 1. Core Services (The 4 Pillars)
- **T2OS Core & Jarvis Brain (`ez-zel`):** `https://ez-zel.onrender.com` (Repo: `T2Digital/ez-zel`, Branch: `master`)
  - الواجهة الرئيسية، المستشار الصوتي جارفيس (`JarvisBattleStationModal`)، مصنع التطبيقات، بوابة الدفع (`Paymob`)، وخدمة سحابة الـ ERP للمستأجرين.
- **T2 AI Agent (Sales & CRM 24/7):** `https://khedr-bot-agent.onrender.com`
  - وكيل المبيعات الفعلي على WhatsApp / Messenger / Instagram / TikTok، صندوق المحادثات (`CRM`)، وفحص المنصات، وتدريب `Playground`.
  - عميل الربط في `ez-zel`: `services/t2AgentApiClient.ts` (`T2_AGENT_API_URL`, `T2_AGENT_ADMIN_KEY`).
- **T2OS Content Studio:** `https://t2-studio.vercel.app` (Firestore project: `t2-content-studio`)
  - استوديو صناعة ونشر المحتوى وتقويم الـ 7 أيام.
  - عميل الربط: `services/titoStudioApiClient.ts` و `services/titoStudioFirestoreBridge.ts`.
- **Tenant App Templates (PWA + ERP/POS):**
  - **Commerce & ERP (`battah`):** `D:\battah-template` (`T2Digital/battah`, `main`) — مثال حي: **أوتو هاوس** `https://t2-tenant-auto-house.vercel.app` (`D:\t2-tenant-auto-house`).
  - **Services & Booking (`clean_master`):** مثل `https://cleanmaster-eg.com`.

## 2. Unified Brand Command Hub (`JarvisBrandCommandHub`)
- **UI:** `components/jarvis/JarvisBrandCommandHub.tsx` — يفتح داخل مربع العرض مكان الشبكة (`activeDeckTab === 'brand_hub'`).
- **Voice/Chat Trigger:** أمر `SWITCH_BRAND` / `OPEN_BRAND_HUB` من `services/jarvisBrainEngine.ts` يفتح شاشة البراند المطلوب تلقائياً.
- **Backend API (`routes/brandHubRoutes.ts`):**
  - `GET /api/brand-hub/:idOrSlug` — يجمع بيانات التطبيق + الكتالوج + إعدادات `Firestore` (`t2_brand_hub_configs`) + المحادثات وحالة المنصات الحية من `T2 AI Agent`.
  - `POST /api/brand-hub/:idOrSlug/health-check` — فحص اتصال حي للرابط الفعلي + Cloud ERP + T2 Agent + السوشيال.
  - `POST /api/brand-hub/:idOrSlug/update` — حفظ محمي بالتوكن في `Firestore` + مزامنة `storefrontSettings` في `Cloud ERP` + دفع التدريب لـ `T2 AI Agent`.
  - `POST /api/brand-hub/:idOrSlug/reply` — إرسال رد يدوي عبر `T2 AI Agent`.
  - `POST /api/brand-hub/:idOrSlug/playground-correct` — حفظ تصحيح تدريب في `T2 AI Agent`.

## 3. Tenant Cloud ERP & Auth
- `routes/tenantErpRoutes.ts` + `services/tenantErpStoreService.ts`:
  - `POST /api/tenant-auth/login`
  - `GET /api/tenant-erp/:slug/state`
  - `POST /api/tenant-erp/:slug/sync`
  - `POST /api/tenant-erp/:slug/orders`
