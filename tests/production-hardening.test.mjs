import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { tsImport } from "tsx/esm/api";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(import.meta.dirname, "..");
const importTs = (relPath, query = "") =>
  tsImport(pathToFileURL(path.join(ROOT, relPath)).href + query, import.meta.url);

test("1) securityMiddleware rejects unverified fake Bearer tokens with 401", async () => {
  const { requireSovereignApiAccess } = await importTs(path.join("middleware", "securityMiddleware.ts"));

  let statusCode = 200;
  let jsonBody = null;
  let nextCalled = false;

  const req = {
    originalUrl: "/api/terminal/execute",
    path: "/api/terminal/execute",
    headers: {
      authorization: "Bearer 123456789012345678901",
    },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      jsonBody = body;
      return this;
    },
  };

  requireSovereignApiAccess(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);
  assert.equal(jsonBody?.ok, false);
});

test("2) serverAdminAuth does not use hardcoded fallback secret and signs/verifies session tokens", async () => {
  const savedKeys = {
    TENANT_AUTH_SECRET: process.env.TENANT_AUTH_SECRET,
    ADMIN_API_SECRET: process.env.ADMIN_API_SECRET,
    ADMIN_SECRET_KEY: process.env.ADMIN_SECRET_KEY,
    T2_AGENT_ADMIN_KEY: process.env.T2_AGENT_ADMIN_KEY,
    NODE_ENV: process.env.NODE_ENV,
  };

  delete process.env.TENANT_AUTH_SECRET;
  delete process.env.ADMIN_API_SECRET;
  delete process.env.ADMIN_SECRET_KEY;
  delete process.env.T2_AGENT_ADMIN_KEY;
  process.env.NODE_ENV = "production";

  try {
    const authMod = await importTs(path.join("services", "serverAdminAuth.ts"), "?isolated=1");
    const srcText = fs.readFileSync(path.join(ROOT, "services", "serverAdminAuth.ts"), "utf8");
    assert.equal(srcText.includes("t2os_sovereign_fallback_secret_2026"), false);

    const token = authMod.signAdminSessionToken("ahm.atya@gmail.com");
    assert.ok(token.startsWith("t2adm_"));
    const verified = authMod.verifyAdminSessionToken(token);
    assert.equal(verified.ok, true);
    assert.equal(verified.email, "ahm.atya@gmail.com");

    const invalid = authMod.verifyAdminSessionToken("t2adm_fake.tampered");
    assert.equal(invalid.ok, false);
  } finally {
    for (const [k, v] of Object.entries(savedKeys)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
});

test("3) verifyPaymobWebhookHmac rejects missing/invalid HMAC and accepts valid HMAC", async () => {
  const prevSecret = process.env.PAYMOB_HMAC_SECRET;
  process.env.PAYMOB_HMAC_SECRET = "test_paymob_hmac_secret_2026";

  try {
    const { verifyPaymobWebhookHmac } = await importTs(path.join("services", "paymobService.ts"));

    const obj = {
      amount_cents: 500000,
      created_at: "2026-11-22T06:00:00",
      currency: "EGP",
      error_occured: false,
      has_parent_transaction: false,
      id: 99123,
      integration_id: 1234,
      is_3d_secure: true,
      is_auth: false,
      is_capture: false,
      is_refunded: false,
      is_standalone_payment: true,
      is_voided: false,
      order: { id: 888777 },
      owner: 444,
      pending: false,
      source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
      success: true,
    };

    const concat = [
      obj.amount_cents, obj.created_at, obj.currency, obj.error_occured,
      obj.has_parent_transaction, obj.id, obj.integration_id, obj.is_3d_secure,
      obj.is_auth, obj.is_capture, obj.is_refunded, obj.is_standalone_payment,
      obj.is_voided, obj.order.id, obj.owner, obj.pending,
      obj.source_data.pan, obj.source_data.sub_type, obj.source_data.type, obj.success,
    ].map(String).join("");

    const validHmac = crypto.createHmac("sha512", process.env.PAYMOB_HMAC_SECRET).update(concat).digest("hex");

    assert.equal(verifyPaymobWebhookHmac(obj, undefined), false);
    assert.equal(verifyPaymobWebhookHmac(obj, "deadbeef"), false);
    assert.equal(verifyPaymobWebhookHmac(obj, validHmac), true);
  } finally {
    if (prevSecret === undefined) delete process.env.PAYMOB_HMAC_SECRET;
    else process.env.PAYMOB_HMAC_SECRET = prevSecret;
  }
});

test("4) calculateCodProfitability accounts for shipping, CPA, and 20% return rate", async () => {
  const { calculateCodProfitability } = await importTs(path.join("services", "dropshippingEngineService.ts"));

  const winner = calculateCodProfitability({
    sellingPriceEgp: 1250,
    supplierCostEgp: 420,
    shippingCostEgp: 65,
    cpaAdCostEgp: 95,
    expectedReturnRatePct: 20,
  });
  // deliveredRatio = 0.8 -> returnLoss = (0.2/0.8)*65 = 16.25 -> cpaDelivered = 95/0.8 = 118.75 -> net = 1250 - 420 - 65 - 16.25 - 118.75 = 630
  assert.equal(winner.realNetProfitPerDeliveredEgp, 630);
  assert.equal(winner.verdict, "WINNING_PRODUCT");

  const weak = calculateCodProfitability({
    sellingPriceEgp: 350,
    supplierCostEgp: 190,
    shippingCostEgp: 65,
    cpaAdCostEgp: 95,
    expectedReturnRatePct: 20,
  });
  assert.equal(weak.verdict, "REJECT_LOW_MARGIN");
  assert.ok(weak.realNetMarginPct < 20);
});

test("5) buildZeroPriceSupplierDispatchText includes customer & shipping info with ZERO selling price leakage", async () => {
  const { buildZeroPriceSupplierDispatchText } = await importTs(path.join("services", "dropshippingEngineService.ts"));

  const text = buildZeroPriceSupplierDispatchText({
    refCode: "DRP-554433",
    productName: "لوحة نيون فليكس مقاس 70 سم",
    qty: 2,
    bundleLabel: "عرض الباقتين شحن مجاني",
    customerName: "محمود إبراهيم",
    customerPhone: "01099887766",
    governorate: "الجيزة",
    address: "المهندسين شارع جامعة الدول",
    bostaTrackingNumber: "BST-990011",
    // Even if order object contains sensitive pricing on callers, output must exclude them
  });

  assert.ok(text.includes("DRP-554433"));
  assert.ok(text.includes("محمود إبراهيم"));
  assert.ok(text.includes("01099887766"));
  assert.ok(text.includes("الجيزة"));
  assert.ok(text.includes("BST-990011"));
  assert.equal(text.includes("2150"), false);
  assert.equal(text.includes("ج.م"), false);
});

test("6) Static contract: 100% of declared tools in toolsConfig.ts (84/84) are handled in chatToolHandler.ts", () => {
  const tc = fs.readFileSync(path.join(ROOT, "services", "toolsConfig.ts"), "utf8");
  const toolNames = [...new Set([...tc.matchAll(/name:\s*["']([a-zA-Z0-9_]+)["']/g)].map((m) => m[1]))];
  const cth = fs.readFileSync(path.join(ROOT, "services", "chatToolHandler.ts"), "utf8");
  const unhandled = toolNames.filter((t) => !cth.includes(`"${t}"`) && !cth.includes(`'${t}'`));

  assert.equal(toolNames.length, 84);
  assert.deepEqual(unhandled, []);
});

test("7) khedr-bot corsMiddleware allows https://t2os.app with credentials and blocks untrusted origins", () => {
  const { corsMiddleware } = require("D:/khedr-bot/middlewares/securityMiddleware.js");

  const makeMockRes = () => {
    const headers = {};
    return {
      headers,
      statusCode: 200,
      setHeader(k, v) {
        headers[k.toLowerCase()] = v;
      },
      status(c) {
        this.statusCode = c;
        return this;
      },
      end() {
        return this;
      },
    };
  };

  // Trusted origin
  const resTrusted = makeMockRes();
  let calledTrusted = false;
  corsMiddleware({ method: "GET", headers: { origin: "https://t2os.app" } }, resTrusted, () => {
    calledTrusted = true;
  });
  assert.equal(calledTrusted, true);
  assert.equal(resTrusted.headers["access-control-allow-origin"], "https://t2os.app");
  assert.equal(resTrusted.headers["access-control-allow-credentials"], "true");

  // Untrusted origin GET
  const resEvil = makeMockRes();
  corsMiddleware({ method: "GET", headers: { origin: "https://evil-attacker.example" } }, resEvil, () => {});
  assert.equal(resEvil.headers["access-control-allow-origin"], undefined);
  assert.equal(resEvil.headers["access-control-allow-credentials"], undefined);

  // Untrusted origin preflight OPTIONS
  const resEvilOpt = makeMockRes();
  corsMiddleware({ method: "OPTIONS", headers: { origin: "https://evil-attacker.example" } }, resEvilOpt, () => {});
  assert.equal(resEvilOpt.statusCode, 403);
});
