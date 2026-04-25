import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API proxy for Gemini content generation
  app.post("/api/gemini/generateContent", async (req, res) => {
    try {
      const { model, contents, config, overrideApiKey } = req.body;
      const rawKey = overrideApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const apiKey = rawKey ? rawKey.trim() : undefined;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const generatePromise = ai.models.generateContent({
        model: model || 'gemini-2.5-pro', // use an accessible model as default
        contents: contents,
        config: config
      });
      
      // 60 seconds timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request Timeout')), 60000);
      });
      
      const response = await Promise.race([generatePromise, timeoutPromise]);
      res.json({
          text: response.text || "",
          functionCalls: response.functionCalls || [],
          candidates: response.candidates || []
      });
    } catch (error: any) {
      console.error("Gemini API Error (Server):", error);
      res.status(500).json({ error: error.message, status: error.status });
    }
  });

  // API proxy for Gemini Embeddings
  app.post("/api/gemini/embedContent", async (req, res) => {
    try {
      const { model, contents, overrideApiKey } = req.body;
      const rawKey = overrideApiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      const apiKey = rawKey ? rawKey.trim() : undefined;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server" });
      }
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.embedContent({ model, contents });
      
      // embedContent returns { embeddings: [{ values: [...] }] }
      res.json(response);
    } catch (error: any) {
      console.error("Gemini Embedding Error (Server):", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
