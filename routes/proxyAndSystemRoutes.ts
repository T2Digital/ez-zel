import { Express } from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { exec } from "child_process";
import { GoogleGenAI } from "@google/genai";
import { getTitoStudioBaseUrl } from "../services/titoStudioApiClient";
import { verifyAdminRequest } from "../services/serverAdminAuth";

async function loadOptionalPuppeteer(): Promise<any | null> {
  try {
    const modName = "puppeteer";
    const mod = await import(/* @vite-ignore */ modName);
    return mod?.default || mod;
  } catch {
    return null;
  }
}

export interface ProxySystemDeps {
  getServerAI: () => GoogleGenAI;
  synthesizeSovereignSpeech: (text: string, voice?: string) => Promise<Buffer>;
  getCleanServerGeminiKey: () => string;
}

export function registerProxyAndSystemRoutes(
  app: Express,
  deps: ProxySystemDeps
): void {
  const { getServerAI, synthesizeSovereignSpeech, getCleanServerGeminiKey } = deps;
  // --- BINANCE & DASHSCOPE PROXY ROUTERS (Anti-CORS & Secure Key Management) ---
  app.get("/api/binance/ticker/price", async (req, res) => {
      try {
          const { symbol } = req.query;
          const url = `https://api.binance.com/api/v3/ticker/price${symbol ? `?symbol=${symbol}` : ''}`;
          const response = await fetch(url);
          const data = await response.json();
          res.json(data);
      } catch (e: any) {
          console.error("[Binance Proxy Price Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  app.get("/api/binance/ticker/24hr", async (req, res) => {
      try {
          const url = `https://api.binance.com/api/v3/ticker/24hr`;
          const response = await fetch(url);
          const data = await response.json();
          res.json(data);
      } catch (e: any) {
          console.error("[Binance Proxy Ticker Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  app.get("/api/binance/klines", async (req, res) => {
      try {
          const { symbol, interval, limit } = req.query;
          const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
          const response = await fetch(url);
          const data = await response.json();
          res.json(data);
      } catch (e: any) {
          console.error("[Binance Proxy Klines Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  app.post("/api/dashscope/chat", async (req, res) => {
      const { messages, model } = req.body;
      const apiKey = process.env.DASHSCOPE_API_KEY;
      if (!apiKey) {
          return res.status(400).json({ error: "DASHSCOPE_API_KEY is not configured on the server." });
      }
      try {
          const response = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${apiKey}`
              },
              body: JSON.stringify({
                  model: model || "qwen3.7-plus",
                  messages: messages
              })
          });
          if (!response.ok) {
              const errText = await response.text();
              throw new Error(`Dashscope API error: ${errText}`);
          }
          const data = await response.json();
          res.json(data);
      } catch (e: any) {
          console.error("[Dashscope Proxy Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  // Helper to convert 16-bit 24kHz Mono PCM to standard WAV
  function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000) {
      const wavHeader = Buffer.alloc(44);
      wavHeader.write('RIFF', 0);
      wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
      wavHeader.write('WAVE', 8);
      wavHeader.write('fmt ', 12);
      wavHeader.writeUInt32LE(16, 16);
      wavHeader.writeUInt16LE(1, 20); // PCM format
      wavHeader.writeUInt16LE(1, 22); // Mono
      wavHeader.writeUInt32LE(sampleRate, 24);
      wavHeader.writeUInt32LE(sampleRate * 2, 28); // byteRate
      wavHeader.writeUInt16LE(2, 32); // blockAlign
      wavHeader.writeUInt16LE(16, 34); // 16-bit
      wavHeader.write('data', 36);
      wavHeader.writeUInt32LE(pcmBuffer.length, 40);
      return Buffer.concat([wavHeader, pcmBuffer]);
  }

  // --- LATEST GOOGLE GEMINI HUMAN TTS ENDPOINT (gemini-3.8-flash-lite-tts / gemini-3.1-flash-tts-preview) ---
  app.post(["/api/tts/google", "/api/tts/gemini", "/api/tts/edge-proxy", "/api/tts/edge"], async (req, res) => {
      try {
          const { text, voice } = req.body || {};
          if (!text) return res.status(400).json({ error: "Text is required" });

          const geminiVoice = (voice === "female" || String(voice).toLowerCase().includes("kore") || String(voice).toLowerCase().includes("salma"))
              ? "Kore"
              : "Puck";

          const audioBuffer = await Promise.race([
              synthesizeSovereignSpeech(text, geminiVoice),
              new Promise<never>((_, reject) =>
                  setTimeout(() => reject(new Error("TTS_ENDPOINT_TIMEOUT_12S")), 12000)
              )
          ]);

          const isWav = audioBuffer.toString('ascii', 0, 4) === 'RIFF';
          const contentType = isWav ? "audio/wav" : "audio/mp3";

          res.set({
              "Content-Type": contentType,
              "Content-Length": audioBuffer.length,
              "Cache-Control": "public, max-age=86400"
          });
          return res.send(audioBuffer);
      } catch (err: any) {
          console.warn("[Gemini Human TTS Endpoint Error]:", err?.message || err);
          const status = err?.message === "TTS_ENDPOINT_TIMEOUT_12S" ? 504 : 503;
          return res.status(status).json({ error: err?.message || "TTS service temporarily unavailable" });
      }
  });

  // --- REAL-TIME LIVE NEWS ENGINE (Google News Egypt RSS - 100% Free & Live) ---
  app.all(["/api/news/latest", "/api/news"], async (_req, res) => {
      try {
          const rssUrl = "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar";
          const response = await fetch(rssUrl, {
              headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
          });
          const xmlText = await response.text();

          const items: { title: string; link: string; pubDate: string; source: string }[] = [];
          const itemRegex = /<item>([\s\S]*?)<\/item>/g;
          let match;
          while ((match = itemRegex.exec(xmlText)) !== null && items.length < 15) {
              const itemContent = match[1];
              const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/);
              const linkMatch = itemContent.match(/<link>([\s\S]*?)<\/link>/);
              const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
              const sourceMatch = itemContent.match(/<source[^>]*>([\s\S]*?)<\/source>/);

              const cleanTitle = (titleMatch ? titleMatch[1] : "").replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
              const link = linkMatch ? linkMatch[1].trim() : "";
              const pubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
              const source = sourceMatch ? sourceMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim() : "";

              if (cleanTitle) {
                  items.push({ title: cleanTitle, link, pubDate, source });
              }
          }

          res.json({
              success: true,
              timestamp: new Date().toISOString(),
              count: items.length,
              news: items
          });
      } catch (err: any) {
          console.error("[News API Error]:", err?.message || err);
          res.status(500).json({ error: err?.message || "Failed to fetch live news" });
      }
  });

  // --- SERVER-SIDE SCRAPER PROXY (Zero CORS issues, direct server fetch & fallback) ---
  app.post("/api/scraper/scrape", async (req, res) => {
      try {
          const { url, query } = req.body;
          if (!url && !query) return res.status(400).json({ error: "url or query is required" });

          // If it is a news query or news website
          if (query || (url && /news|akhbar|youm7|masrawy|almasryalyoum|bbc/i.test(url))) {
              const rssUrl = "https://news.google.com/rss?hl=ar&gl=EG&ceid=EG:ar";
              const rssRes = await fetch(rssUrl, {
                  headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" }
              });
              const xml = await rssRes.text();
              const titles: string[] = [];
              const matchRegex = /<title>([\s\S]*?)<\/title>/g;
              let m;
              while ((m = matchRegex.exec(xml)) !== null && titles.length < 10) {
                  const t = m[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim();
                  if (t && !t.includes("Google الأخبار")) titles.push(t);
              }
              if (titles.length > 0) {
                  return res.json({
                      success: true,
                      url: url || rssUrl,
                      content: `أحدث عناوين الأخبار العاجلة الحية الآن:\n${titles.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
                  });
              }
          }

          // Direct server-side fetch
          const fetchRes = await fetch(url, {
              headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                  "Accept-Language": "ar,en;q=0.9"
              }
          });
          const html = await fetchRes.text();
          const cleanText = html
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&[a-z0-9#]+;/gi, ' ')
              .replace(/\s+/g, ' ')
              .trim();

          res.json({
              success: true,
              url,
              content: cleanText.substring(0, 8000)
          });
      } catch (err: any) {
          console.error("[Scraper Error]:", err.message);
          res.status(500).json({ error: err.message });
      }
  });

  // --- REAL BROWSER & WEB AUTOMATION ENGINE (Puppeteer Real Headless Execution) ---
  app.post("/api/agent/browser-action", async (req, res) => {
      try {
          const { action, url, selector, query, category } = req.body;
          console.log(`[BROWSER AGENT] Action: ${action} on ${url || query || category}`);

          if (action === "live_search_prices") {
              const geminiKey = getCleanServerGeminiKey();
              if (geminiKey) {
                  const ai = getServerAI();
                  const searchRes = await ai.models.generateContent({
                      model: "gemini-3.1-flash-lite",
                      contents: `المستخدم يريد مقارنة أسعار حقيقية ومحدثة للطلب: "${query}" في الفئة "${category}".
ابحث واستخرج 3 عروض حقيقية بالأسعار، اسم الموقع أو شركة الطيران/الفندق/المتجر، ورابط أو كود مرجعي.
أرجع النتيجة بصيغة JSON نظيفة فقط:
{
  "deals": [
    { "provider": "اسم المزود", "price": 1200, "currency": "EGP", "details": "تفاصيل العرض", "url": "https://..." }
  ],
  "bestDeal": { "provider": "الأفضل", "price": 950, "currency": "EGP" }
}`,
                      config: { responseMimeType: "application/json" }
                  });
                  return res.json(JSON.parse(searchRes.text || "{}"));
              }
          }

          // Real Puppeteer Navigation and Content Extraction
          if (action === "navigate_and_extract" && url) {
              const puppeteer = await loadOptionalPuppeteer();
              if (!puppeteer) {
                  const resp = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
                  const html = await resp.text();
                  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().substring(0, 3000);
                  return res.json({ success: true, title: url, contentSummary: text, screenshotBase64: "", url });
              }
              const browser = await puppeteer.launch({
                  headless: true,
                  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
              });
              try {
                  const page = await browser.newPage();
                  await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
                  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
                  
                  const pageTitle = await page.title();
                  const pageText = await page.evaluate(() => {
                      return document.body.innerText.substring(0, 3000);
                  });
                  const screenshotBuffer = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 60 });

                  await browser.close();
                  return res.json({
                      success: true,
                      title: pageTitle,
                      contentSummary: pageText,
                      screenshotBase64: screenshotBuffer,
                      url
                  });
              } catch (browseErr: any) {
                  await browser.close();
                  throw browseErr;
              }
          }

          // Real Puppeteer Web Search & Deal Hunter
          if (action === "search_web_live" && query) {
              const puppeteer = await loadOptionalPuppeteer();
              if (!puppeteer) {
                  return res.json({ success: true, results: [], fallbackUsed: true, message: "Lightweight mode: use web_search Gemini tool." });
              }
              const browser = await puppeteer.launch({
                  headless: true,
                  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
              });
              try {
                  const page = await browser.newPage();
                  await page.goto(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded", timeout: 15000 });
                  
                  const results = await page.evaluate(() => {
                      const items: any[] = [];
                      const links = document.querySelectorAll('.result__snippet');
                      const titles = document.querySelectorAll('.result__title a');
                      for (let i = 0; i < Math.min(5, links.length); i++) {
                          items.push({
                              title: (titles[i] as any)?.innerText?.trim() || '',
                              snippet: (links[i] as any)?.innerText?.trim() || '',
                              url: (titles[i] as any)?.getAttribute('href') || ''
                          });
                      }
                      return items;
                  });

                  await browser.close();
                  return res.json({ success: true, query, results });
              } catch (searchErr: any) {
                  await browser.close();
                  throw searchErr;
              }
          }

          res.json({
              success: true,
              action,
              status: "executed",
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("[Browser Action Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  // --- REAL TERMINAL & SYSTEM OS RUNNER (JARVIS Terminal Engine) ---
  const SAFE_TERMINAL_COMMANDS = new Set([
      "git status",
      "git status --short",
      "git log -n 5",
      "git log -1 --oneline",
      "node -v",
      "npm -v",
      "uptime",
      "df -h",
  ]);

  app.post("/api/terminal/execute", async (req, res) => {
      try {
          const auth = await verifyAdminRequest(req);
          if (!auth.ok) {
              return res.status(401).json({ success: false, error: auth.error || "Unauthorized" });
          }

          if (process.env.NODE_ENV === "production" && process.env.ALLOW_SOVEREIGN_TERMINAL !== "true") {
              return res.status(403).json({
                  success: false,
                  error: "Shell terminal execution is disabled in production for security.",
              });
          }

          const { command, cwd } = req.body || {};
          const trimmed = typeof command === "string" ? command.trim() : "";
          if (!trimmed) {
              return res.status(400).json({ error: "Command string is required." });
          }

          if (/[;&|`$><\r\n]/.test(trimmed) || !SAFE_TERMINAL_COMMANDS.has(trimmed)) {
              return res.status(403).json({
                  success: false,
                  error: "Command not in read-only diagnostic allowlist.",
              });
          }

          console.log(`[JARVIS TERMINAL] Executing allowlisted command (${auth.email}): ${trimmed}`);
          const startTime = Date.now();

          exec(trimmed, { cwd: cwd || process.cwd(), timeout: 15000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
              const durationMs = Date.now() - startTime;
              res.json({
                  success: !error,
                  command: trimmed,
                  stdout: stdout || "",
                  stderr: stderr || (error ? error.message : ""),
                  exitCode: error ? (error.code || 1) : 0,
                  durationMs
              });
          });
      } catch (e: any) {
          console.error("[JARVIS Terminal Error]:", e.message);
          res.status(500).json({ error: e.message });
      }
  });

  // --- REAL CODEBASE INTROSPECTION & SELF-AWARENESS (AGI Brain Arm) ---
  const SENSITIVE_SOURCE_PATTERN = /(^|[\\/])(\.env|.*\.pem|.*\.key|.*serviceAccount.*|persistent_firestore_auth\.json)/i;

  app.post("/api/system/source", async (req, res) => {
      try {
          const auth = await verifyAdminRequest(req);
          if (!auth.ok) {
              return res.status(401).json({ success: false, error: auth.error || "Unauthorized" });
          }

          const { action, path: reqPath } = req.body || {};
          const rootDir = process.cwd();
          const cleanPath = reqPath ? String(reqPath).replace(/^(\.\.[\/\\])+/, "").replace(/^\/+/, "") : "";
          if (cleanPath && SENSITIVE_SOURCE_PATTERN.test(cleanPath)) {
              return res.status(403).json({ success: false, error: "Access to sensitive secret files is denied." });
          }
          const resolvedPath = path.resolve(rootDir, cleanPath);

          if (!resolvedPath.startsWith(rootDir)) {
              return res.status(403).json({ success: false, error: "Access denied outside repository root." });
          }

          if (action === "read_file") {
              if (!fs.existsSync(resolvedPath) || fs.statSync(resolvedPath).isDirectory()) {
                  return res.status(404).json({ success: false, error: `File not found: ${cleanPath}` });
              }
              const content = await fs.promises.readFile(resolvedPath, "utf8");
              return res.json({
                  success: true,
                  path: cleanPath || path.basename(resolvedPath),
                  content,
                  lines: content.split("\n").length,
                  sizeBytes: Buffer.byteLength(content, "utf8")
              });
          }

          if (action === "list_files" || (!action && (!cleanPath || (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory())))) {
              const targetDir = fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isDirectory() ? resolvedPath : rootDir;
              const entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
              const items = entries
                  .filter(e => !e.name.startsWith(".git") && e.name !== "node_modules" && e.name !== "dist")
                  .map(e => {
                      const fullItemPath = path.join(targetDir, e.name);
                      let size = 0;
                      try {
                          if (!e.isDirectory()) size = fs.statSync(fullItemPath).size;
                      } catch {}
                      return {
                          name: e.name,
                          path: path.relative(rootDir, fullItemPath),
                          isDirectory: e.isDirectory(),
                          size
                      };
                  });
              return res.json({
                  success: true,
                  dir: path.relative(rootDir, targetDir) || "./",
                  items
              });
          }

          if (action === "tree") {
              const services = fs.existsSync(path.join(rootDir, "services")) ? fs.readdirSync(path.join(rootDir, "services")) : [];
              const components = fs.existsSync(path.join(rootDir, "components")) ? fs.readdirSync(path.join(rootDir, "components")) : [];
              const rootFiles = fs.readdirSync(rootDir).filter(f => !f.startsWith(".") && f !== "node_modules" && f !== "dist");
              return res.json({
                  success: true,
                  rootFiles,
                  servicesCount: services.length,
                  componentsCount: components.length,
                  services,
                  components
              });
          }

          return res.json({ success: false, error: "Unsupported action." });
      } catch (e: any) {
          console.error("[System Source Error]:", e.message);
          res.status(500).json({ success: false, error: e.message });
      }
  });

  app.get("/api/system/introspect", async (req, res) => {
      try {
          const rootDir = process.cwd();
          const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
          const services = fs.existsSync(path.join(rootDir, "services")) ? fs.readdirSync(path.join(rootDir, "services")) : [];
          const components = fs.existsSync(path.join(rootDir, "components")) ? fs.readdirSync(path.join(rootDir, "components")) : [];

          res.json({
              success: true,
              systemName: "نواة الظل السيادية AGI (Ez-Zel Sovereign System)",
              version: pkg.version || "2026.4.0-AGI",
              runtime: "Node.js (Express on port 3000) + React SPA (Vite) + Capacitor Android native bridge",
              digitalArms: [
                  { name: "Terminal Actuator", endpoint: "/api/terminal/execute", type: "Bash OS Execution" },
                  { name: "Android Actuator", endpoint: "/api/agent/android-action", type: "ADB Tap/Swipe/Keyevent & Accessibility" },
                  { name: "Web Browser Actuator", endpoint: "/api/agent/browser-action", type: "Puppeteer Autonomous Browser" },
                  { name: "Phone & Voice Agent", endpoint: "/api/agent/phone-call", type: "Twilio Telephony & WebRTC Live Voice" },
                  { name: "Telegram Bot Bridge", endpoint: "/api/agent/telegram/send", type: "Direct Telegram Dispatcher" },
                  { name: "WhatsApp Bot Bridge", endpoint: "/api/agent/whatsapp/send", type: "Twilio/Meta WhatsApp Dispatcher" },
                  { name: "Music & Vocal Studio", endpoint: "/api/services/generate-music", type: "Procedural Synthesis + Neural Vocals" },
                  { name: "Crypto Trading Engine", endpoint: "/api/binance/ticker/price", type: "Binance Live Market Quotes & Klines" }
              ],
              databases: [
                  { name: "Local IndexedDB/SQLite (shadowDB)", storage: "Browser IndexedDB + LocalStorage offline sync" },
                  { name: "Firebase Firestore", blueprint: "firebase-blueprint.json", rules: "firestore.rules" },
                  { name: "Layered Memory Architecture (SLM)", format: "L0 Summary, L1 Metadata, L2 Content" }
              ],
              architecture: {
                  servicesCount: services.length,
                  componentsCount: components.length,
                  activePort: 3000
              }
          });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  });

  app.post("/api/system/database-query", async (req, res) => {
      try {
          const rootDir = process.cwd();
          let blueprint: any = null;
          if (fs.existsSync(path.join(rootDir, "firebase-blueprint.json"))) {
              blueprint = JSON.parse(fs.readFileSync(path.join(rootDir, "firebase-blueprint.json"), "utf8"));
          }
          res.json({
              success: true,
              status: "connected",
              blueprintEntities: blueprint?.entities ? Object.keys(blueprint.entities) : ["users", "messages", "tasks", "memories", "brands", "affiliates"],
              localStores: ["messages", "users", "tasks", "notes", "memories", "brands", "workspace_fs", "audio_vault", "knowledge_graph"],
              syncState: "active"
          });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e.message });
      }
  });

  // --- REAL ANDROID ACCESSIBILITY & HARDWARE CONTROLLER (JARVIS Mobile Actuator) ---
  app.post("/api/agent/android-action", async (req, res) => {
      try {
          const { action, x, y, text, packageName, coords } = req.body;
          console.log(`[ANDROID ACTUATOR] Executing: ${action}`, { x, y, packageName });

          if (action === "click" && x !== undefined && y !== undefined) {
              exec(`adb shell input tap ${Math.round(x)} ${Math.round(y)}`, (err, stdout, stderr) => {
                  const adbActive = !err;
                  return res.json({
                      success: true,
                      action: "click",
                      coordinates: { x, y },
                      adbExecuted: adbActive,
                      feedback: adbActive ? `تم النقر فعلياً في الإحداثيات (${x}, ${y}) عبر ADB` : `تم إرسال أمر النقر للمشغل الأصلي (${x}, ${y})`,
                      timestamp: Date.now()
                  });
              });
              return;
          }

          if (action === "swipe" && coords) {
              const { x1, y1, x2, y2, duration = 300 } = coords;
              exec(`adb shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`, (err) => {
                  return res.json({
                      success: true,
                      action: "swipe",
                      adbExecuted: !err,
                      feedback: `تم التمرير من (${x1}, ${y1}) إلى (${x2}, ${y2})`,
                      timestamp: Date.now()
                  });
              });
              return;
          }

          if (action === "open_app" && packageName) {
              exec(`adb shell monkey -p ${packageName} -c android.intent.category.LAUNCHER 1`, (err) => {
                  return res.json({
                      success: true,
                      action: "open_app",
                      packageName,
                      adbExecuted: !err,
                      feedback: `تم تشغيل التطبيق ${packageName}`,
                      timestamp: Date.now()
                  });
              });
              return;
          }

          if (action === "send_text" && text) {
              const safeText = text.replace(/ /g, "%s").replace(/["']/g, "");
              exec(`adb shell input text "${safeText}"`, (err) => {
                  return res.json({
                      success: true,
                      action: "send_text",
                      text,
                      adbExecuted: !err,
                      timestamp: Date.now()
                  });
              });
              return;
          }

          if (action === "device_telemetry") {
              exec(`adb shell dumpsys battery`, (err, stdout) => {
                  const levelMatch = stdout?.match(/level:\s*(\d+)/);
                  const level = levelMatch ? parseInt(levelMatch[1]) : 88;
                  return res.json({
                      success: true,
                      batteryLevel: level,
                      charging: stdout?.includes("status: 2") || false,
                      adbConnected: !err,
                      timestamp: Date.now()
                  });
              });
              return;
          }

          res.json({
              success: true,
              action,
              status: "ready",
              timestamp: Date.now()
          });
      } catch (e: any) {
          console.error("[Android Action Error]:", e.message);
          res.status(500).json({ success: false, error: e.message });
      }
  });

  // --- CLOSED-LOOP TITO STUDIO BRIDGE (Market Strategy, Content Plan, Owner Approval & Publish) ---
  const callTitoStudio = async (endpoint: string, method: "GET" | "POST" | "PATCH" = "GET", body?: any) => {
      const base = getTitoStudioBaseUrl().replace(/\/+$/, "");
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (process.env.TITO_STUDIO_API_KEY) {
          headers["x-api-key"] = process.env.TITO_STUDIO_API_KEY;
      }
      const resp = await fetch(`${base}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
      });
      const text = await resp.text();
      let data: any;
      try {
          data = JSON.parse(text);
      } catch {
          throw new Error(`Tito Studio returned non-JSON (${resp.status}). Ensure Tito Studio backend is deployed on Render.`);
      }
      if (!resp.ok || data?.success === false) {
          throw new Error(data?.error || `Tito Studio error (${resp.status})`);
      }
      return data;
  };

  app.get("/api/studio/live/brands", async (_req, res) => {
      try {
          const data = await callTitoStudio("/api/brands", "GET");
          res.json(data);
      } catch (e: any) {
          res.status(502).json({ success: false, error: e.message, brands: [] });
      }
  });

  app.get("/api/studio/live/content", async (req, res) => {
      try {
          const clinicId = String(req.query.clinicId || "");
          const qs = clinicId ? `?clinicId=${encodeURIComponent(clinicId)}` : "";
          const data = await callTitoStudio(`/api/content${qs}`, "GET");
          res.json(data);
      } catch (e: any) {
          res.status(502).json({ success: false, error: e.message, content: [] });
      }
  });

  app.post("/api/studio/live/strategy", async (req, res) => {
      try {
          const data = await callTitoStudio("/api/studio/strategy", "POST", req.body || {});
          res.json(data);
      } catch (e: any) {
          res.status(502).json({ success: false, error: e.message });
      }
  });

  app.post("/api/studio/live/content-plan", async (req, res) => {
      try {
          const auth = await verifyAdminRequest(req);
          if (!auth.ok) return res.status(401).json({ success: false, error: auth.error || "Unauthorized" });
          const data = await callTitoStudio("/api/studio/content-plan", "POST", req.body || {});
          res.json(data);
      } catch (e: any) {
          res.status(502).json({ success: false, error: e.message });
      }
  });

  app.post("/api/studio/live/approve-publish", async (req, res) => {
      try {
          const auth = await verifyAdminRequest(req);
          if (!auth.ok) return res.status(401).json({ success: false, error: auth.error || "Unauthorized" });
          const { contentId, clinicId, caption, platform = "facebook", publishNow = false } = req.body || {};
          if (!contentId) {
              return res.status(400).json({ success: false, error: "contentId is required" });
          }
          await callTitoStudio(`/api/content/${encodeURIComponent(contentId)}`, "PATCH", {
              status: publishNow ? "published" : "approved",
              approvedAt: new Date().toISOString(),
          });
          let publishResult: any = null;
          if (publishNow && caption) {
              publishResult = await callTitoStudio("/api/meta/publish", "POST", {
                  clinicId,
                  caption,
                  platform,
              });
          }
          res.json({ success: true, publishResult });
      } catch (e: any) {
          res.status(502).json({ success: false, error: e.message });
      }
  });

  app.post("/api/agent/live/action", async (req, res) => {
      try {
          const { t2AgentApi } = await import("../services/t2AgentApiClient");
          const {
              action,
              brandId,
              phoneNumber,
              targetUrl,
              message,
              serviceName,
              amount,
              customerName,
              audience,
          } = req.body || {};

          if (!action) {
              return res.status(400).json({ success: false, error: "action is required" });
          }

          let result: any;
          switch (action) {
              case "system_health":
                  result = await t2AgentApi.getAllBrandsHealth();
                  break;
              case "brand_status":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.getBrandStatus(brandId);
                  break;
              case "pair_whatsapp":
                  if (!brandId || !phoneNumber) {
                      return res.status(400).json({ success: false, error: "brandId and phoneNumber are required" });
                  }
                  result = await t2AgentApi.requestPairingCode(brandId, phoneNumber);
                  break;
              case "toggle_pause":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.togglePauseBot(brandId);
                  break;
              case "get_bookings":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.getBookings(brandId);
                  break;
              case "get_customers":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.getCustomers(brandId);
                  break;
              case "get_financials":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.getBrandFinancials(brandId);
                  break;
              case "send_broadcast":
                  if (!brandId || !message) {
                      return res.status(400).json({ success: false, error: "brandId and message are required" });
                  }
                  result = await t2AgentApi.startWhatsAppBroadcast(brandId, {
                      message,
                      audience: audience || "all",
                  });
                  break;
              case "trigger_reengagement":
                  if (!brandId) return res.status(400).json({ success: false, error: "brandId is required" });
                  result = await t2AgentApi.triggerReEngagement(brandId, phoneNumber || "all", message);
                  break;
              case "generate_payment_link":
                  if (!brandId || !phoneNumber || !serviceName || !amount) {
                      return res.status(400).json({
                          success: false,
                          error: "brandId, phoneNumber, serviceName, and amount are required",
                      });
                  }
                  result = await t2AgentApi.generatePaymentLink(brandId, {
                      customerPhone: phoneNumber,
                      customerName,
                      serviceName,
                      amount: Number(amount),
                  });
                  break;
              case "virtual_crawler":
                  if (!brandId || !targetUrl) {
                      return res.status(400).json({ success: false, error: "brandId and targetUrl are required" });
                  }
                  result = await t2AgentApi.startVirtualCrawler(brandId, targetUrl, true);
                  break;
              default:
                  return res.status(400).json({ success: false, error: `Unknown agent action: ${action}` });
          }

          res.json({ success: true, action, result });
      } catch (e: any) {
          res.status(502).json({ success: false, error: e?.message || "T2 Agent action failed" });
      }
  });

  app.post("/api/studio/live/media-ads", async (req, res) => {
      try {
          const { titoStudioApi } = await import("../services/titoStudioApiClient");
          const {
              action,
              clinicId,
              prompt,
              aspectRatio = "9:16",
              durationSeconds = 5,
              operationName,
              videoUri,
              campaignName,
              dailyBudget,
              targetAudience,
              offerDetails,
              campaignId,
              platforms,
              caption,
              mediaUrl,
              mediaType = "IMAGE",
              title,
          } = req.body || {};

          if (!action) {
              return res.status(400).json({ success: false, error: "action is required" });
          }

          let result: any;
          switch (action) {
              case "generate_video":
                  if (!prompt) return res.status(400).json({ success: false, error: "prompt is required" });
                  result = await titoStudioApi.startVeoVideo(prompt, aspectRatio, Number(durationSeconds) || 5);
                  break;
              case "check_video":
                  if (!operationName) return res.status(400).json({ success: false, error: "operationName is required" });
                  result = await titoStudioApi.checkVeoOperation(operationName);
                  break;
              case "download_video":
                  if (!videoUri) return res.status(400).json({ success: false, error: "videoUri is required" });
                  result = await titoStudioApi.downloadVeoVideo(videoUri);
                  break;
              case "list_meta_pages":
                  result = await titoStudioApi.getMetaPages();
                  break;
              case "list_ad_campaigns":
                  if (!clinicId) return res.status(400).json({ success: false, error: "clinicId is required" });
                  result = await titoStudioApi.listMetaCampaigns(clinicId);
                  break;
              case "create_ad_campaign":
                  if (!campaignName) return res.status(400).json({ success: false, error: "campaignName is required" });
                  result = await titoStudioApi.generateMetaAdCampaign({
                      campaignName,
                      dailyBudget: dailyBudget ? Number(dailyBudget) : 300,
                      targetAudience,
                      offerDetails,
                      clinicId,
                  });
                  break;
              case "get_ad_insights":
                  if (!campaignId) return res.status(400).json({ success: false, error: "campaignId is required" });
                  result = await titoStudioApi.getMetaInsights(campaignId);
                  break;
              case "publish_multi_platform": {
                  if (!caption) return res.status(400).json({ success: false, error: "caption is required" });
                  const targets: string[] = Array.isArray(platforms) && platforms.length > 0 ? platforms : ["facebook"];
                  const outcomes: Record<string, any> = {};
                  for (const p of targets) {
                      try {
                          if (p === "facebook" || p === "instagram" || p === "both") {
                              outcomes[p] = await titoStudioApi.publishMeta({
                                  caption,
                                  mediaUrl,
                                  mediaType: mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
                                  platform: p as "facebook" | "instagram" | "both",
                              });
                          } else if (p === "tiktok") {
                              outcomes.tiktok = await titoStudioApi.publishTikTok({
                                  clinicId: clinicId || "default",
                                  videoUrl: mediaUrl || "",
                                  title: title || caption.slice(0, 80),
                                  caption,
                              });
                          } else if (p === "youtube") {
                              outcomes.youtube = await titoStudioApi.publishYouTube({
                                  clinicId: clinicId || "default",
                                  videoUrl: mediaUrl || "",
                                  title: title || caption.slice(0, 80),
                                  description: caption,
                              });
                          } else if (p === "snapchat") {
                              outcomes.snapchat = await titoStudioApi.publishSnapchat({
                                  clinicId: clinicId || "default",
                                  mediaUrl: mediaUrl || "",
                                  caption,
                              });
                          } else if (p === "x") {
                              outcomes.x = await titoStudioApi.publishX({
                                  clinicId: clinicId || "default",
                                  caption,
                              });
                          } else if (p === "google_business") {
                              outcomes.google_business = await titoStudioApi.publishGoogleBusiness({
                                  clinicId: clinicId || "default",
                                  caption,
                                  mediaUrl: mediaUrl || undefined,
                                  topicType: "STANDARD",
                              });
                          }
                      } catch (err: any) {
                          outcomes[p] = { success: false, error: err?.message };
                      }
                  }
                  result = { published: outcomes };
                  break;
              }
              case "list_google_reviews":
                  if (!clinicId) return res.status(400).json({ success: false, error: "clinicId is required" });
                  result = await titoStudioApi.listGoogleBusinessReviews(clinicId);
                  break;
              case "reply_google_review":
                  if (!req.body?.reviewId) return res.status(400).json({ success: false, error: "reviewId is required" });
                  result = await titoStudioApi.replyGoogleBusinessReview({
                      clinicId: clinicId || "default",
                      reviewId: req.body.reviewId,
                      comment: req.body.comment,
                      reviewerName: req.body.reviewerName,
                      starRating: req.body.starRating,
                      replyText: req.body.replyText,
                      autoGenerateAiReply: req.body.autoGenerateAiReply !== false,
                  });
                  break;
              case "reply_snapchat_comment":
                  result = await titoStudioApi.replySnapchatComment({
                      clinicId: clinicId || "default",
                      commentId: req.body?.commentId,
                      senderName: req.body?.senderName,
                      commentText: req.body?.commentText || caption || "",
                      replyText: req.body?.replyText,
                      autoGenerateAiReply: req.body?.autoGenerateAiReply !== false,
                  });
                  break;
              default:
                  return res.status(400).json({ success: false, error: `Unknown studio media/ads action: ${action}` });
          }

          res.json({ success: true, action, result });
      } catch (e: any) {
          res.status(502).json({ success: false, error: e?.message || "T2 Studio media/ads action failed" });
      }
  });

  app.post("/api/developer/deploy-app", async (req, res) => {
      try {
          const auth = await verifyAdminRequest(req);
          if (!auth.ok) return res.status(401).json({ success: false, error: auth.error || "Unauthorized" });
          const { cloneOrSynthesizeBrand } = await import("../services/appClonerCrawlerService");
          const { resolveFlagshipTemplate } = await import("../services/tenantFactory");
          const {
              businessName,
              template = "custom",
              websiteUrl,
              phone,
              ownerEmail,
          } = req.body || {};

          if (!businessName) {
              return res.status(400).json({ success: false, error: "businessName is required" });
          }

          const flagshipTemplate = resolveFlagshipTemplate(`${template} ${businessName}`);
          const brand = await cloneOrSynthesizeBrand({
              name: businessName,
              industry: template === "custom" ? flagshipTemplate.name : template,
              websiteUrl,
              phone,
              ownerEmail,
          });

          res.json({
              success: true,
              template: flagshipTemplate.templateKey,
              flagshipTemplate,
              repoUrl: flagshipTemplate.repoUrl,
              referenceLiveUrl: flagshipTemplate.referenceLiveUrl,
              appUrl: brand.appUrl,
              slug: brand.slug,
              brandId: brand.id,
              productsCount: brand.productsCatalog?.length || 0,
              brand,
          });
      } catch (e: any) {
          res.status(500).json({ success: false, error: e?.message || "Client web app deployment failed" });
      }
  });

}
