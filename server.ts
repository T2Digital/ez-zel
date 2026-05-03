import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";

// Mock Database for Agents In-Memory
const activeAgents: Record<string, any> = {};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES --- //

  // 1. Autonomous Agent Queue endpoint
  app.post("/api/agents/spawn", (req, res) => {
    const { taskId, prompt, userId } = req.body;
    console.log(`[AGENT NODE] Spawning background task ${taskId} for ${userId}`);
    
    // Simulate background worker
    activeAgents[taskId] = { status: 'running', logs: ['Agent spawned'], prompt };
    
    // In a real prod environment, you'd push this to Redis/BullMQ or a separate Python microservice.
    setTimeout(() => {
        if(activeAgents[taskId]) {
            activeAgents[taskId].logs.push('Gathering preliminary data...');
        }
    }, 5000);

    res.json({ success: true, taskId, status: 'spawned' });
  });

  app.get("/api/agents/:taskId", (req, res) => {
      const { taskId } = req.params;
      const agent = activeAgents[taskId];
      if (!agent) {
          return res.status(404).json({ error: "Agent not found or finished" });
      }
      res.json(agent);
  });

  app.get("/api/proxy", async (req, res) => {
      const targetUrl = req.query.url as string;
      if (!targetUrl) {
          res.status(400).send("No url provided");
          return;
      }
      try {
          const response = await fetch(targetUrl);
          const arrayBuffer = await response.arrayBuffer();
          res.setHeader("Content-Type", response.headers.get("content-type") || "image/png");
          res.setHeader("Access-Control-Allow-Origin", "*");
          res.send(Buffer.from(arrayBuffer));
      } catch(e) {
          console.error("Proxy error:", e);
          res.status(500).send("Failed to proxy");
      }
  });

  // 2. External Services Mock Endpoints (to be backed by real APIs via process.env)
  app.post("/api/services/whatsapp", (req, res) => {
      // In prod: Use process.env.TWILIO_AUTH_TOKEN
      const { target, message } = req.body;
      console.log(`[WHATSAPP BRIDGE] Sending message to ${target}: ${message}`);
      res.json({ success: true, deliveryStatus: 'queued' });
  });

  app.post("/api/services/text-to-video", (req, res) => {
      // In prod: Use process.env.REPLICATE_API_TOKEN or FAL_KEY
      const { prompt } = req.body;
      console.log(`[VIDEO GEN] Generating video for: ${prompt}`);
      res.json({ success: true, videoUrl: 'https://cdn.pixabay.com/video/2023/10/22/186026-876800755_tiny.mp4' });
  });

  // --- VITE MIDDLEWARE --- //
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Note: express v5 handles '*all' differently if you use that!
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[SYSTEM] Full-stack architecture enabled. Background queues ready.`);
  });
}

startServer();
