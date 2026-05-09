import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import crypto from "crypto";
import { Queue } from "bullmq";
import Redis from "ioredis";
import { spawn } from "child_process";

// 1. Initialise Message Queue (BullMQ + Redis)
import { processAgentTask } from "./worker";
let autonomousQueue: any;

if (process.env.REDIS_URL) {
    const connection = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    autonomousQueue = new Queue("autonomous-agents-queue", { connection });
} else {
    console.warn("[SYSTEM] No REDIS_URL provided. Using Local Fallback Queue for dev.");
    const dummyJobs = new Map();
    autonomousQueue = {
        getRepeatableJobs: async () => [],
        removeRepeatableByKey: async () => {},
        add: async (name: string, payload: any, opts: any) => {
            const jobId = opts?.jobId || Date.now().toString();
            dummyJobs.set(jobId, { status: "running", progress: 0 });
            setTimeout(async () => {
                try {
                    const result = await processAgentTask({ id: jobId, name, data: payload } as any);
                    dummyJobs.set(jobId, { status: "completed", progress: 100, returnvalue: result });
                } catch(e: any) {
                    dummyJobs.set(jobId, { status: "failed", progress: 0, failedReason: e.message });
                }
            }, 100);
            return { id: jobId };
        },
        getJob: async (taskId: string) => {
            const inf = dummyJobs.get(taskId);
            if (!inf) return null;
            return {
                isCompleted: async () => inf.status === "completed",
                isFailed: async () => inf.status === "failed",
                progress: inf.progress,
                returnvalue: inf.returnvalue,
                failedReason: inf.failedReason
            };
        }
    };
}

// 2. Setup Proactive Cron Job
async function setupCronJobs() {
    // We can clear existing repeatable jobs to avoid duplicates on restart
    const repeatables = await autonomousQueue.getRepeatableJobs();
    for (const job of repeatables) {
        await autonomousQueue.removeRepeatableByKey(job.key);
    }
    
    // Add a cron job to wake up the agent every day at 8 AM
    await autonomousQueue.add('morning-routine-task', {
        prompt: "صباح الخير! هذا إيقاظ آلي مجدول. يرجى قراءة أهم التقارير والذاكرة، وتجهيز وتلخيص أهداف اليوم.",
        userId: "system-cron",
        taskId: "cron-job-" + Date.now()
    }, {
        repeat: { pattern: '0 8 * * *' } // Every morning at 8:00 AM
    });
    console.log("[SYSTEM] BullMQ Proactive Cron Job registered (0 8 * * *).");
}
setupCronJobs();

// 3. Spawn the separate Worker microservice!
let workerProcess: ReturnType<typeof spawn>;
function spawnWorker() {
    if (!process.env.REDIS_URL) {
        console.log("[SYSTEM] Not spawning separate worker process (using in-memory queue fallback).");
        return;
    }
    console.log("[SYSTEM] Forking Sidecar Worker microservice...");
    workerProcess = spawn("npx", ["tsx", "--watch", "worker.ts"] , { stdio: "inherit" });
    workerProcess.on('error', (err) => { console.error("Worker failed to start:", err); });
    workerProcess.on('exit', (code) => {
        console.log(`[SYSTEM] Worker exited with code ${code}. Respawning in 3 seconds...`);
        setTimeout(spawnWorker, 3000);
    });
}
spawnWorker();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API ROUTES --- //

  // 1. Autonomous Agent Queue endpoint (ADK Server-Side Executor)
  app.post("/api/agents/spawn", async (req, res) => {
    const { prompt, userId } = req.body;
    const taskId = crypto.randomBytes(16).toString("hex");
    console.log(`[SERVER] Enqueuing background task ${taskId} into BullMQ for ${userId}`);
    
    await autonomousQueue.add('agent-task', { prompt, userId, taskId }, {
        jobId: taskId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 }
    });

    res.json({ success: true, taskId, status: 'spawned', backend: 'BullMQ + Sidecar Worker' });
  });

  app.get("/api/agents/:taskId", async (req, res) => {
      const { taskId } = req.params;
      try {
          const job = await autonomousQueue.getJob(taskId);
          if (!job) return res.status(404).json({ error: "Agent not found" });

          const isCompleted = await job.isCompleted();
          const isFailed = await job.isFailed();
          const progress = typeof job.progress === 'number' ? job.progress : 0;
          
          if (isCompleted) {
              const result = job.returnvalue;
              return res.json({ status: 'completed', result: result?.result || "No data" });
          } else if (isFailed) {
              return res.json({ status: 'failed', result: job.failedReason });
          } else {
              return res.json({ status: 'running', progress });
          }
      } catch(e) {
          res.status(500).json({ error: 'Queue check failed' });
      }
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
