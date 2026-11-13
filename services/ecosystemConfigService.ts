import fs from "fs";
import path from "path";

export interface EcosystemIntegrationConfig {
  titoStudioUrl?: string;
  titoStudioApiKey?: string;
  t2AgentUrl?: string;
  t2AgentAdminKey?: string;
  updatedAt?: string;
}

function getConfigFilePath(): string {
  const baseDir = process.env.PERSISTENT_DATA_DIR || path.join(process.cwd(), "data");
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }
  return path.join(baseDir, "ecosystem_integrations.json");
}

export function loadEcosystemConfig(): EcosystemIntegrationConfig {
  try {
    const file = getConfigFilePath();
    if (!fs.existsSync(file)) return {};
    const raw = fs.readFileSync(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveEcosystemConfig(
  updates: Partial<EcosystemIntegrationConfig>
): EcosystemIntegrationConfig {
  const current = loadEcosystemConfig();
  const next: EcosystemIntegrationConfig = {
    ...current,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  // Apply immediately to runtime env so all clients pick it up without restart
  if (next.titoStudioUrl) process.env.TITO_STUDIO_API_URL = next.titoStudioUrl.trim();
  if (next.titoStudioApiKey) process.env.TITO_STUDIO_API_KEY = next.titoStudioApiKey.trim();
  if (next.t2AgentUrl) process.env.T2_AGENT_API_URL = next.t2AgentUrl.trim();
  if (next.t2AgentAdminKey) process.env.T2_AGENT_ADMIN_KEY = next.t2AgentAdminKey.trim();

  fs.writeFileSync(getConfigFilePath(), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function applyStoredEcosystemConfigOnBoot(): void {
  const cfg = loadEcosystemConfig();
  if (cfg.titoStudioUrl && !process.env.TITO_STUDIO_API_URL) {
    process.env.TITO_STUDIO_API_URL = cfg.titoStudioUrl;
  } else if (cfg.titoStudioUrl) {
    process.env.TITO_STUDIO_API_URL = cfg.titoStudioUrl;
  }
  if (cfg.titoStudioApiKey) process.env.TITO_STUDIO_API_KEY = cfg.titoStudioApiKey;
  if (cfg.t2AgentUrl) process.env.T2_AGENT_API_URL = cfg.t2AgentUrl;
  if (cfg.t2AgentAdminKey) process.env.T2_AGENT_ADMIN_KEY = cfg.t2AgentAdminKey;
}

async function probeServiceEndpoint(
  name: string,
  baseUrl: string,
  healthPath: string
): Promise<{
  name: string;
  baseUrl: string;
  status: "CONNECTED" | "HTML_ONLY" | "UNREACHABLE";
  httpStatus?: number;
  latencyMs: number;
  detail: string;
}> {
  const started = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${baseUrl.replace(/\/+$/, "")}${healthPath}`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);

    const latencyMs = Date.now() - started;
    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();
    const isHtml = contentType.includes("text/html") || /^\s*<!doctype html/i.test(text);

    if (isHtml) {
      return {
        name,
        baseUrl,
        status: "HTML_ONLY",
        httpStatus: res.status,
        latencyMs,
        detail: "يرد بصفحة HTML (واجهة SPA أو بوابة تسجيل دخول) وليس JSON API",
      };
    }

    return {
      name,
      baseUrl,
      status: res.ok ? "CONNECTED" : "UNREACHABLE",
      httpStatus: res.status,
      latencyMs,
      detail: res.ok ? "متصل ويعمل بكفاءة JSON API" : `استجابة HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      name,
      baseUrl,
      status: "UNREACHABLE",
      latencyMs: Date.now() - started,
      detail: err?.name === "AbortError" ? "انتهت مهلة الاتصال (Timeout)" : (err?.message || "تعذر الاتصال"),
    };
  }
}

export async function runLiveEcosystemHealthProbe(
  studioUrl: string,
  agentUrl: string
) {
  const [studio, agent] = await Promise.all([
    probeServiceEndpoint("Tito Studio", studioUrl, "/api/health"),
    probeServiceEndpoint("T2 AI Agent", agentUrl, "/api/system/health"),
  ]);

  return {
    checkedAt: new Date().toISOString(),
    ezZel: {
      name: "Ez-Zel / Jarvis OS",
      status: "CONNECTED" as const,
      geminiConfigured: Boolean(process.env.GEMINI_API_KEY),
      persistentDisk: Boolean(process.env.PERSISTENT_DATA_DIR),
      uptimeSeconds: Math.round(process.uptime()),
    },
    titoStudio: studio,
    t2Agent: agent,
  };
}
