import { Pool } from "pg";

let pool: Pool | null = null;
let schemaReady = false;
let schemaInitPromise: Promise<boolean> | null = null;

export function isPostgresConfigured(): boolean {
  const url = String(process.env.DATABASE_URL || "").trim();
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function getPgPool(): Pool | null {
  if (!isPostgresConfigured()) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: Number(process.env.PG_POOL_MAX || 12),
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
    pool.on("error", (err) => {
      console.warn("[Postgres] Pool error:", err?.message || err);
    });
  }
  return pool;
}

export async function initPostgresSchema(): Promise<boolean> {
  if (schemaReady) return true;
  const p = getPgPool();
  if (!p) return false;
  if (schemaInitPromise) return schemaInitPromise;

  schemaInitPromise = (async () => {
    try {
      await p.query(`
        CREATE TABLE IF NOT EXISTS t2_kv_store (
          doc_key TEXT PRIMARY KEY,
          filename TEXT NOT NULL,
          payload JSONB NOT NULL,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS t2_tenants (
          canonical_id TEXT PRIMARY KEY,
          slug TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          industry TEXT,
          app_template TEXT NOT NULL DEFAULT 'products_erp',
          lifecycle_stage TEXT NOT NULL DEFAULT 'trial',
          subscription_status TEXT NOT NULL DEFAULT 'trial',
          plan_id TEXT NOT NULL DEFAULT 'trial_7d',
          plan_amount_egp INTEGER DEFAULT 0,
          trial_started_at TIMESTAMPTZ,
          trial_ends_at TIMESTAMPTZ,
          paid_expires_at TIMESTAMPTZ,
          tito_studio_id TEXT,
          agent_brand_id TEXT,
          store_url TEXT,
          dedicated_live_url TEXT,
          metadata JSONB DEFAULT '{}'::jsonb,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS t2_tenant_erp_states (
          slug TEXT PRIMARY KEY,
          state JSONB NOT NULL DEFAULT '{}'::jsonb,
          auth_record JSONB,
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS t2_ai_cost_ledger (
          id BIGSERIAL PRIMARY KEY,
          brand_id TEXT NOT NULL,
          service TEXT NOT NULL,
          operation TEXT NOT NULL,
          model TEXT NOT NULL,
          input_units INTEGER DEFAULT 0,
          output_units INTEGER DEFAULT 0,
          estimated_cost_usd NUMERIC(10,6) NOT NULL,
          estimated_cost_egp NUMERIC(10,4) NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_t2_ai_cost_brand_date
          ON t2_ai_cost_ledger (brand_id, created_at DESC);
      `);
      schemaReady = true;
      return true;
    } catch (err: any) {
      console.warn("[Postgres] Schema init failed:", err?.message || err);
      schemaInitPromise = null;
      return false;
    }
  })();

  return schemaInitPromise;
}

export async function pingPostgres(): Promise<{ configured: boolean; connected: boolean; latencyMs?: number; error?: string }> {
  if (!isPostgresConfigured()) return { configured: false, connected: false };
  const p = getPgPool();
  if (!p) return { configured: false, connected: false };
  const t0 = Date.now();
  try {
    await p.query("SELECT 1");
    return { configured: true, connected: true, latencyMs: Date.now() - t0 };
  } catch (err: any) {
    return { configured: true, connected: false, error: err?.message || "PG ping failed" };
  }
}

export async function pgGetKv<T = any>(docKey: string): Promise<T | null> {
  if (!(await initPostgresSchema())) return null;
  const p = getPgPool();
  if (!p) return null;
  try {
    const res = await p.query("SELECT payload FROM t2_kv_store WHERE doc_key = $1", [docKey]);
    return res.rows[0]?.payload ?? null;
  } catch {
    return null;
  }
}

export async function pgSetKv(docKey: string, filename: string, payload: any): Promise<boolean> {
  if (!(await initPostgresSchema())) return false;
  const p = getPgPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO t2_kv_store (doc_key, filename, payload, updated_at)
       VALUES ($1, $2, $3::jsonb, NOW())
       ON CONFLICT (doc_key) DO UPDATE SET
         filename = EXCLUDED.filename,
         payload = EXCLUDED.payload,
         updated_at = NOW()`,
      [docKey, filename, JSON.stringify(payload)]
    );
    return true;
  } catch (err: any) {
    console.warn(`[Postgres] pgSetKv(${docKey}) failed:`, err?.message);
    return false;
  }
}

export interface PgTenantRecord {
  canonicalId: string;
  slug: string;
  name: string;
  industry?: string;
  appTemplate?: string;
  lifecycleStage?: string;
  subscriptionStatus?: string;
  planId?: string;
  planAmountEgp?: number;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  paidExpiresAt?: string | null;
  titoStudioId?: string;
  agentBrandId?: string;
  storeUrl?: string;
  dedicatedLiveUrl?: string;
  metadata?: Record<string, any>;
}

export async function pgUpsertTenant(entry: PgTenantRecord): Promise<boolean> {
  if (!(await initPostgresSchema())) return false;
  const p = getPgPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO t2_tenants (
        canonical_id, slug, name, industry, app_template, lifecycle_stage,
        subscription_status, plan_id, plan_amount_egp,
        trial_started_at, trial_ends_at, paid_expires_at,
        tito_studio_id, agent_brand_id, store_url, dedicated_live_url, metadata, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17::jsonb,NOW())
      ON CONFLICT (canonical_id) DO UPDATE SET
        slug = EXCLUDED.slug,
        name = EXCLUDED.name,
        industry = COALESCE(EXCLUDED.industry, t2_tenants.industry),
        app_template = COALESCE(EXCLUDED.app_template, t2_tenants.app_template),
        lifecycle_stage = COALESCE(EXCLUDED.lifecycle_stage, t2_tenants.lifecycle_stage),
        subscription_status = COALESCE(EXCLUDED.subscription_status, t2_tenants.subscription_status),
        plan_id = COALESCE(EXCLUDED.plan_id, t2_tenants.plan_id),
        plan_amount_egp = COALESCE(EXCLUDED.plan_amount_egp, t2_tenants.plan_amount_egp),
        trial_started_at = COALESCE(EXCLUDED.trial_started_at, t2_tenants.trial_started_at),
        trial_ends_at = COALESCE(EXCLUDED.trial_ends_at, t2_tenants.trial_ends_at),
        paid_expires_at = COALESCE(EXCLUDED.paid_expires_at, t2_tenants.paid_expires_at),
        tito_studio_id = COALESCE(EXCLUDED.tito_studio_id, t2_tenants.tito_studio_id),
        agent_brand_id = COALESCE(EXCLUDED.agent_brand_id, t2_tenants.agent_brand_id),
        store_url = COALESCE(EXCLUDED.store_url, t2_tenants.store_url),
        dedicated_live_url = COALESCE(EXCLUDED.dedicated_live_url, t2_tenants.dedicated_live_url),
        metadata = t2_tenants.metadata || EXCLUDED.metadata,
        updated_at = NOW()`,
      [
        entry.canonicalId,
        entry.slug,
        entry.name,
        entry.industry || null,
        entry.appTemplate || "products_erp",
        entry.lifecycleStage || "trial",
        entry.subscriptionStatus || "trial",
        entry.planId || "trial_7d",
        Number(entry.planAmountEgp || 0),
        entry.trialStartedAt || null,
        entry.trialEndsAt || null,
        entry.paidExpiresAt || null,
        entry.titoStudioId || entry.canonicalId,
        entry.agentBrandId || entry.slug,
        entry.storeUrl || null,
        entry.dedicatedLiveUrl || null,
        JSON.stringify(entry.metadata || {}),
      ]
    );
    return true;
  } catch (err: any) {
    console.warn(`[Postgres] pgUpsertTenant(${entry.slug}) failed:`, err?.message);
    return false;
  }
}

export async function pgGetAllTenants(): Promise<any[]> {
  if (!(await initPostgresSchema())) return [];
  const p = getPgPool();
  if (!p) return [];
  try {
    const res = await p.query("SELECT * FROM t2_tenants ORDER BY updated_at DESC");
    return res.rows || [];
  } catch {
    return [];
  }
}

export async function pgGetTenantBySlugOrId(needle: string): Promise<any | null> {
  if (!(await initPostgresSchema())) return null;
  const p = getPgPool();
  if (!p) return null;
  try {
    const clean = String(needle || "").trim().toLowerCase();
    const res = await p.query(
      `SELECT * FROM t2_tenants
       WHERE LOWER(slug) = $1 OR LOWER(canonical_id) = $1 OR LOWER(tito_studio_id) = $1 OR LOWER(agent_brand_id) = $1
       LIMIT 1`,
      [clean]
    );
    return res.rows[0] || null;
  } catch {
    return null;
  }
}

export async function pgLoadTenantErp(slug: string): Promise<{ state: Record<string, any>; authRecord: any; updatedAt?: string } | null> {
  if (!(await initPostgresSchema())) return null;
  const p = getPgPool();
  if (!p) return null;
  try {
    const res = await p.query(
      "SELECT state, auth_record, updated_at FROM t2_tenant_erp_states WHERE slug = $1",
      [slug]
    );
    if (!res.rows[0]) return null;
    const row = res.rows[0];
    return {
      state: row.state && typeof row.state === "object" ? row.state : {},
      authRecord: row.auth_record || null,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    };
  } catch {
    return null;
  }
}

export async function pgSaveTenantErp(
  slug: string,
  partialState: Record<string, any>,
  authRecord?: Record<string, any> | null
): Promise<Record<string, any> | null> {
  if (!(await initPostgresSchema())) return null;
  const p = getPgPool();
  if (!p) return null;
  const client = await p.connect();
  try {
    await client.query("BEGIN");
    const existingRes = await client.query(
      "SELECT state, auth_record FROM t2_tenant_erp_states WHERE slug = $1 FOR UPDATE",
      [slug]
    );
    const existingState = existingRes.rows[0]?.state && typeof existingRes.rows[0].state === "object"
      ? existingRes.rows[0].state
      : {};
    const existingAuth = existingRes.rows[0]?.auth_record || null;

    const cleanIncoming = { ...partialState };
    const nextAuth = authRecord !== undefined
      ? authRecord
      : (cleanIncoming.__auth || existingAuth);
    delete cleanIncoming.__auth;

    const mergedState = {
      ...existingState,
      ...cleanIncoming,
      updatedAt: new Date().toISOString(),
    };

    await client.query(
      `INSERT INTO t2_tenant_erp_states (slug, state, auth_record, updated_at)
       VALUES ($1, $2::jsonb, $3::jsonb, NOW())
       ON CONFLICT (slug) DO UPDATE SET
         state = EXCLUDED.state,
         auth_record = COALESCE(EXCLUDED.auth_record, t2_tenant_erp_states.auth_record),
         updated_at = NOW()`,
      [slug, JSON.stringify(mergedState), nextAuth ? JSON.stringify(nextAuth) : null]
    );
    await client.query("COMMIT");
    return {
      ...mergedState,
      ...(nextAuth ? { __auth: nextAuth } : {}),
    };
  } catch (err: any) {
    await client.query("ROLLBACK").catch(() => {});
    console.warn(`[Postgres] pgSaveTenantErp(${slug}) failed:`, err?.message);
    return null;
  } finally {
    client.release();
  }
}

export async function pgRecordAiUsage(entry: {
  brandId: string;
  service: string;
  operation: string;
  model: string;
  inputUnits?: number;
  outputUnits?: number;
  estimatedCostUsd: number;
  estimatedCostEgp: number;
}): Promise<boolean> {
  if (!(await initPostgresSchema())) return false;
  const p = getPgPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO t2_ai_cost_ledger
       (brand_id, service, operation, model, input_units, output_units, estimated_cost_usd, estimated_cost_egp)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        entry.brandId || "system",
        entry.service,
        entry.operation,
        entry.model,
        Math.round(Number(entry.inputUnits || 0)),
        Math.round(Number(entry.outputUnits || 0)),
        Number(entry.estimatedCostUsd || 0),
        Number(entry.estimatedCostEgp || 0),
      ]
    );
    return true;
  } catch {
    return false;
  }
}

export async function pgGetAiUsageSummary(days = 30): Promise<any[]> {
  if (!(await initPostgresSchema())) return [];
  const p = getPgPool();
  if (!p) return [];
  try {
    const safeDays = Math.max(1, Math.min(365, Number(days) || 30));
    const res = await p.query(
      `SELECT
         brand_id AS "brandId",
         operation,
         COUNT(*)::int AS calls,
         SUM(estimated_cost_usd)::float AS "totalUsd",
         SUM(estimated_cost_egp)::float AS "totalEgp"
       FROM t2_ai_cost_ledger
       WHERE created_at >= NOW() - ($1 || ' days')::interval
       GROUP BY brand_id, operation`,
      [String(safeDays)]
    );
    return res.rows || [];
  } catch {
    return [];
  }
}

export async function pgExportAllTablesForBackup(): Promise<Record<string, any> | null> {
  if (!(await initPostgresSchema())) return null;
  const p = getPgPool();
  if (!p) return null;
  try {
    const [kv, tenants, erp, aiRecent] = await Promise.all([
      p.query("SELECT doc_key, filename, payload, updated_at FROM t2_kv_store"),
      p.query("SELECT * FROM t2_tenants"),
      p.query("SELECT slug, state, auth_record, updated_at FROM t2_tenant_erp_states"),
      p.query("SELECT * FROM t2_ai_cost_ledger ORDER BY id DESC LIMIT 5000"),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      t2_kv_store: kv.rows,
      t2_tenants: tenants.rows,
      t2_tenant_erp_states: erp.rows,
      t2_ai_cost_ledger_recent: aiRecent.rows,
    };
  } catch {
    return null;
  }
}
