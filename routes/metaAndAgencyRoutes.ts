import { Express } from "express";
import fs from "fs";
import path from "path";
import {
  publishBrandPost,
  launchAdCampaign,
  runSelfOptimizingLoop,
  getPublishedLogs,
} from "../services/growthAgencyEngine";
import {
  getT2AgentBrands,
  getT2AgentBrandStatus,
  getT2AgentPairingQr,
  updateT2AgentInstructions,
  sendT2AgentWhatsAppMessage,
  getT2AgentBookings,
  getT2AgentConversations,
  toggleT2AgentBotStatus,
} from "../services/titoAgentBridgeService";
import {
  getMetaAuthUrl,
  handleMetaCallback,
  getMetaPages,
  generateCloudStrategy,
  generateNanoBananaImage,
  generateVeoVideo,
  downloadVeoVideo,
  publishMetaPost,
  processScheduledPosts,
  getCloudStorageFiles,
  getMetaPosts,
  getScheduledPosts,
  scheduleMetaPost,
} from "../services/metaAndCloudSuiteService";

export function registerMetaAndAgencyRoutes(app: Express): void {
  // --- SOVEREIGN GROWTH AGENCY PIPELINE (Bridges 2, 3 & 4) --- //
  app.post("/api/growth/publish-post", async (req, res) => {
      try {
          const { brandId, postIndex } = req.body || {};
          if (!brandId) return res.status(400).json({ error: "brandId is required" });
          const result = await publishBrandPost(brandId, postIndex || 0);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.post("/api/growth/launch-campaign", async (req, res) => {
      try {
          const { brandId, budgetEgp, platform, objective, customHook } = req.body || {};
          if (!brandId) return res.status(400).json({ error: "brandId is required" });
          const campaign = await launchAdCampaign({
              brandId,
              budgetEgp: budgetEgp || 2500,
              platform: platform || 'meta',
              objective: objective || 'click_to_whatsapp',
              customHook
          });
          res.json({ success: true, campaign });
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.post("/api/growth/optimize-loop", async (req, res) => {
      try {
          const { brandId } = req.body || {};
          if (!brandId) return res.status(400).json({ error: "brandId is required" });
          const result = await runSelfOptimizingLoop(brandId);
          res.json({ success: true, result });
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/growth/agency-status", (_req, res) => {
      try {
          const filePath = path.join(process.cwd(), "data", "brands.json");
          const brands = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : {};
          const logs = getPublishedLogs();
          const campsPath = path.join(process.cwd(), "data", "campaigns.json");
          const campaigns = fs.existsSync(campsPath) ? JSON.parse(fs.readFileSync(campsPath, "utf8")) : [];

          res.json({
              success: true,
              agencyStatus: "AUTONOMOUS_OPERATIONAL",
              totalActiveBrands: Object.keys(brands).length,
              totalCampaignsLaunched: campaigns.length,
              totalPublishedPosts: logs.length,
              recentPublishedLogs: logs.slice(0, 10),
              activeCampaigns: campaigns.slice(0, 10),
              timestamp: new Date().toISOString()
          });
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/growth/published-logs", (_req, res) => {
      res.json({ success: true, logs: getPublishedLogs() });
  });

  // --- SOVEREIGN T2 AGENT SUITE (WHATSAPP & AI FLEET) --- //
  app.get("/api/t2-agent/brands", async (_req, res) => {
      try {
          const result = await getT2AgentBrands();
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/t2-agent/brands/:id/status", async (req, res) => {
      try {
          const result = await getT2AgentBrandStatus(req.params.id);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/t2-agent/brands/:id/qr", async (req, res) => {
      try {
          const result = await getT2AgentPairingQr(req.params.id);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.post("/api/t2-agent/brands/:id/instructions", async (req, res) => {
      try {
          const result = await updateT2AgentInstructions(req.params.id, req.body?.systemInstruction || "");
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.post("/api/t2-agent/brands/:id/send-message", async (req, res) => {
      try {
          const result = await sendT2AgentWhatsAppMessage(req.params.id, req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/t2-agent/brands/:id/bookings", async (req, res) => {
      try {
          const result = await getT2AgentBookings(req.params.id);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.get("/api/t2-agent/brands/:id/conversations", async (req, res) => {
      try {
          const result = await getT2AgentConversations(req.params.id);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  app.post("/api/t2-agent/brands/:id/toggle-bot", async (req, res) => {
      try {
          const result = await toggleT2AgentBotStatus(req.params.id, req.body?.status);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // --- SOVEREIGN META & CLOUD SUITE API (12 ENDPOINTS) --- //
  // 1. Create Facebook Page & Link Instagram Business
  app.post("/api/meta/pages/create", async (req, res) => {
      try {
          const result = await createMetaPage(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 2. Fetch Connected Meta Ad Accounts
  app.get("/api/meta/ads/accounts", async (req, res) => {
      try {
          const token = req.query.token as string | undefined;
          const result = await getMetaAdAccounts(token);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 3. Launch AI-Powered Meta Ad Campaign
  app.post("/api/meta/ads/campaigns/create", async (req, res) => {
      try {
          const result = await createMetaAdCampaign(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 4. Live Ad Insights & ROAS Telemetry
  app.get("/api/meta/ads/insights", async (req, res) => {
      try {
          const token = req.query.token as string | undefined;
          const result = await getMetaAdsInsights(token);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 5. Cloud Storage & CDN Media Upload
  app.post("/api/upload", async (req, res) => {
      try {
          const hostUrl = `${req.protocol}://${req.get("host")}`;
          const result = await uploadMediaPayload(req.body || {}, hostUrl);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 6. Test Cloud Storage Bucket Connectivity (R2 / S3 / GCS)
  app.post("/api/storage/test", async (req, res) => {
      try {
          const result = await testStorageBucket(req.body?.storageConfig);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 7. Dispatch Alert Test Notification (Telegram & WhatsApp)
  app.post("/api/alerts/test", async (req, res) => {
      try {
          const result = await sendAlertTest(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 8. Generate Brand Identity & Kit with Gemini AI
  app.post("/api/brand/generateKit", async (req, res) => {
      try {
          const result = await generateBrandKit(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 9. Generate Google Veo Cinematic 3D Videos (9:16)
  app.post("/api/gemini/generateVideos", async (req, res) => {
      try {
          const result = await generateVeoVideo(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 10. Cache and Download Veo Video to Permanent CDN URL
  app.post("/api/gemini/downloadVideo", async (req, res) => {
      try {
          const hostUrl = `${req.protocol}://${req.get("host")}`;
          const result = await downloadVeoVideo(req.body?.videoUri || "", hostUrl);
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 11. Dual Live Publish to Facebook & Instagram
  app.post("/api/meta/publish", async (req, res) => {
      try {
          const result = await publishMetaPost(req.body || {});
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });

  // 12. Automated Cron Execution for Scheduled Posts
  app.post("/api/cron/process-scheduled-posts", async (_req, res) => {
      try {
          const result = await processScheduledPosts();
          res.json(result);
      } catch (err: any) {
          res.status(500).json({ error: err?.message });
      }
  });


}
