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

test("8) loadDropshippingFunnels strictly excludes Al-Genedy and loads multi-supplier commercial stores", async () => {
  const { loadDropshippingFunnels } = await importTs(path.join("services", "dropshippingEngineService.ts"));
  const funnels = loadDropshippingFunnels();

  assert.ok(funnels.length >= 2);
  assert.equal(
    funnels.some((f) => String(f.slug).includes("algenedy") || f.agentBrandId === "al_genedy"),
    false
  );
  const captainCar = funnels.find((f) => f.slug === "captaincar-eg");
  assert.ok(captainCar);
  assert.ok(Array.isArray(captainCar.products) && captainCar.products.length >= 3);
  const providers = new Set(captainCar.products.map((p) => p.supplierProvider));
  assert.ok(providers.has("taager"));
  assert.ok(providers.has("cj"));
});

test("9) buildSplitSubOrders splits multi-supplier cart and hides selling price in supplier dispatch", async () => {
  const {
    loadDropshippingFunnels,
    buildSplitSubOrders,
    buildZeroPriceSubOrderDispatchText,
  } = await importTs(path.join("services", "dropshippingEngineService.ts"));

  const store = loadDropshippingFunnels().find((f) => f.slug === "captaincar-eg");
  const taagerItem = store.products.find((p) => p.supplierProvider === "taager");
  const cjItem = store.products.find((p) => p.supplierProvider === "cj");

  const split = buildSplitSubOrders({
    refCode: "DRP-SPLIT-100",
    store,
    shippingFeeEgp: 60,
    items: [
      { productId: taagerItem.id, productName: taagerItem.name, qty: 1, unitPriceEgp: taagerItem.sellingPriceEgp },
      { productId: cjItem.id, productName: cjItem.name, qty: 2, unitPriceEgp: cjItem.sellingPriceEgp },
    ],
  });

  assert.equal(split.subOrders.length, 2);
  const bostaSub = split.subOrders.find((s) => s.supplierProvider === "taager");
  const cjSub = split.subOrders.find((s) => s.supplierProvider === "cj");
  assert.equal(bostaSub.carrierProvider, "bosta");
  assert.equal(cjSub.carrierProvider, "cj_auto");

  const zeroPriceText = buildZeroPriceSubOrderDispatchText(
    {
      refCode: "DRP-SPLIT-100",
      customerName: "سعيد عبد الله",
      customerPhone: "01011223344",
      governorate: "القاهرة",
      address: "المعادي شارع 9",
    },
    cjSub
  );

  assert.ok(zeroPriceText.includes("DRP-SPLIT-100"));
  assert.ok(zeroPriceText.includes(cjItem.sku));
  assert.equal(zeroPriceText.includes(String(cjItem.sellingPriceEgp)), false);
  assert.equal(zeroPriceText.includes(String(cjSub.codCollectionEgp)), false);
});

test("10) applyCarrierWebhookUpdate updates sub-order & parent order status on OTO/CJ/Bosta webhook", async () => {
  const {
    loadDropshippingOrders,
    saveDropshippingOrders,
    applyCarrierWebhookUpdate,
  } = await importTs(path.join("services", "dropshippingEngineService.ts"));

  const backup = loadDropshippingOrders();
  try {
    saveDropshippingOrders([
      {
        id: "drp_test_wh_1",
        refCode: "DRP-WH-1",
        funnelSlug: "captaincar-eg",
        brandName: "CaptainCar EG",
        agentBrandId: "tito_media",
        productName: "Multi Test",
        qty: 2,
        bundleLabel: "2",
        sellingPriceEgp: 1480,
        shippingFeeEgp: 60,
        totalCodEgp: 1540,
        supplierCostTotalEgp: 605,
        adSpendEgp: 85,
        netProfitEgp: 790,
        customerName: "عميل ويب هوك",
        customerPhone: "01055566677",
        governorate: "الجيزة",
        address: "الدقي",
        supplierWhatsapp: "01013372674",
        status: "dispatched_to_supplier",
        whatsappConfirmed: true,
        subOrders: [
          {
            subOrderId: "DRP-WH-1-S1",
            supplierProvider: "knawat",
            supplierId: "knawat-dxb-01",
            supplierName: "Knawat",
            supplierWhatsapp: "01013372674",
            warehouseRegion: "Dubai",
            items: [],
            supplierCostTotalEgp: 605,
            codCollectionEgp: 1540,
            carrierProvider: "oto",
            trackingNumber: "OTO-998877",
            status: "dispatched_to_supplier",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]);

    const res = applyCarrierWebhookUpdate({
      carrier: "oto",
      trackingNumber: "OTO-998877",
      rawState: "delivered",
    });

    assert.equal(res.matched, true);
    assert.equal(res.status, "delivered");
    const after = loadDropshippingOrders()[0];
    assert.equal(after.status, "delivered");
    assert.equal(after.subOrders[0].status, "delivered");
    assert.ok(after.subOrders[0].trackingUrl.includes("OTO-998877"));
  } finally {
    saveDropshippingOrders(backup);
  }
});

test("11) t2-studio studioSecurity enforces fail-closed auth, token redaction, HSTS, and strict CORS", async () => {
  const {
    applyStudioCorsAndSecurityHeaders,
    sanitizeBrandRecord,
    requireStudioApiAuth,
  } = await tsImport(pathToFileURL("D:/t2-studio/src/server/studioSecurity.ts").href, import.meta.url);

  const sanitized = sanitizeBrandRecord(
    {
      id: "brand_1",
      name: "T2",
      metaToken: "EAAG_SECRET_TOKEN",
      tiktokToken: "TT_SECRET",
      selectedMetaPage: { id: "page_1", name: "Page", access_token: "PAGE_SECRET" },
    },
    false
  );
  assert.equal(sanitized.metaToken, undefined);
  assert.equal(sanitized.tiktokToken, undefined);
  assert.equal(sanitized.selectedMetaPage.access_token, undefined);
  assert.equal(sanitized.hasMetaToken, true);
  assert.equal(sanitized.hasTiktokToken, true);

  const makeRes = () => {
    const headers = {};
    return {
      headers,
      statusCode: 200,
      body: null,
      setHeader(k, v) { headers[k.toLowerCase()] = v; },
      removeHeader(k) { delete headers[k.toLowerCase()]; },
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
      end() { return this; },
    };
  };

  // Evil origin preflight blocked with 403 + HSTS header present
  const resCors = makeRes();
  applyStudioCorsAndSecurityHeaders(
    { method: "OPTIONS", path: "/api/brands", headers: { origin: "https://evil.example" } },
    resCors,
    () => {}
  );
  assert.equal(resCors.statusCode, 403);
  assert.ok(String(resCors.headers["strict-transport-security"]).includes("max-age=31536000"));

  // Unauthenticated /api/brands blocked with 401
  const guard = requireStudioApiAuth("fake-firebase-key");
  const resUnauth = makeRes();
  let nextUnauth = false;
  await guard(
    {
      originalUrl: "/api/brands",
      path: "/api/brands",
      headers: { "x-forwarded-for": "203.0.113.5" },
      socket: { remoteAddress: "10.0.0.2" },
    },
    resUnauth,
    () => { nextUnauth = true; }
  );
  assert.equal(nextUnauth, false);
  assert.equal(resUnauth.statusCode, 401);

  // Server API key allowed with server_key mode
  const prevKey = process.env.T2_REMOTE_API_KEY;
  process.env.T2_REMOTE_API_KEY = "unit-test-studio-key-123";
  try {
    const reqAuth = {
      originalUrl: "/api/brands",
      path: "/api/brands",
      headers: { "x-api-key": "unit-test-studio-key-123" },
      socket: { remoteAddress: "10.0.0.2" },
    };
    const resAuth = makeRes();
    let nextAuth = false;
    await guard(reqAuth, resAuth, () => { nextAuth = true; });
    assert.equal(nextAuth, true);
    assert.equal(reqAuth.studioAuthMode, "server_key");
  } finally {
    if (prevKey === undefined) delete process.env.T2_REMOTE_API_KEY;
    else process.env.T2_REMOTE_API_KEY = prevKey;
  }
});

test("12) alGenedyErpRoutes redacts quotes/attendance on public GET and blocks spoofed-Origin writes", async () => {
  const {
    loadAlGenedyErpState,
    saveAlGenedyErpState,
    registerAlGenedyErpRoutes,
  } = await importTs(path.join("routes", "alGenedyErpRoutes.ts"));

  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
  };
  registerAlGenedyErpRoutes(mockApp);

  const backup = loadAlGenedyErpState();
  try {
    saveAlGenedyErpState({
      quotes: [{ id: "q_secret", customerName: "عميل سري", customerPhone: "01000000001" }],
      inventory: [{ id: "inv_1", name: "كلادينج" }],
      attendance: [{ id: "att_1", employeeId: 101 }],
    });

    const invoke = async (key, reqOverrides = {}) => {
      const res = {
        statusCode: 200,
        body: null,
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
      };
      await routes[key]({ headers: {}, body: {}, ...reqOverrides }, res);
      return res;
    };

    // Unauthenticated GET must return public scope with zero quotes & zero attendance PII
    const pubGet = await invoke("GET /api/al-genedy/erp-state");
    assert.equal(pubGet.statusCode, 200);
    assert.equal(pubGet.body.scope, "public");
    assert.equal(pubGet.body.state.inventory.length, 1);
    assert.equal(pubGet.body.state.quotes.length, 0);
    assert.equal(pubGet.body.state.attendance.length, 0);

    // Spoofed Origin + sec-fetch-site POST without admin token must return 401
    const spoofPost = await invoke("POST /api/al-genedy/erp-state", {
      headers: {
        origin: "https://t2os.app",
        host: "t2os.app",
        referer: "https://t2os.app/al-genedy/",
        "sec-fetch-site": "same-origin",
      },
      body: { quotes: [] },
    });
    assert.equal(spoofPost.statusCode, 401);
    assert.equal(spoofPost.body.ok, false);

    // Public quote request validates required fields and appends safely
    const badPubQuote = await invoke("POST /api/al-genedy/public/quote-request", {
      body: { customerName: "أحمد" },
    });
    assert.equal(badPubQuote.statusCode, 400);

    const goodPubQuote = await invoke("POST /api/al-genedy/public/quote-request", {
      body: { customerName: "عميل متجر", customerPhone: "01099887755", estimatedTotal: 14500 },
    });
    assert.equal(goodPubQuote.statusCode, 201);
    assert.equal(goodPubQuote.body.ok, true);
    assert.equal(loadAlGenedyErpState().inventory.length, 1);
  } finally {
    saveAlGenedyErpState({
      quotes: backup.quotes || [],
      inventory: backup.inventory || [],
      attendance: backup.attendance || [],
    });
  }
});

test("13) offServerBackupService performs lossless AES-256-GCM encrypt/decrypt and rejects tampering", async () => {
  const { encryptBackupPayload, decryptBackupPayload } = await importTs(
    path.join("services", "offServerBackupService.ts")
  );
  const secret = "test-strong-backup-secret-2026";
  const sample = Buffer.from(JSON.stringify({ ok: true, count: 42, note: "اختبار النسخ الاحتياطي" }), "utf8");
  const envelope = encryptBackupPayload(sample, secret);

  assert.equal(envelope.alg, "aes-256-gcm");
  assert.equal(envelope.version, "t2os-backup-v1");
  const decrypted = decryptBackupPayload(envelope, secret);
  assert.equal(decrypted.toString("utf8"), sample.toString("utf8"));

  // Tampered ciphertext must throw
  const tampered = {
    ...envelope,
    ciphertextB64: Buffer.from("tampered-bytes").toString("base64"),
  };
  assert.throws(() => decryptBackupPayload(tampered, secret));

  // Wrong key must throw
  assert.throws(() => decryptBackupPayload(envelope, "wrong-secret-key"));
});

test("14) backupAndOpsRoutes enforces 401 admin auth on status, backup run, download, and test alert", async () => {
  const { registerBackupAndOpsRoutes } = await importTs(path.join("routes", "backupAndOpsRoutes.ts"));
  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
  };
  registerBackupAndOpsRoutes(mockApp);

  for (const key of [
    "GET /api/admin/backups/status",
    "POST /api/admin/backups/run",
    "GET /api/admin/backups/download",
    "POST /api/admin/watchdog/test-alert",
  ]) {
    const res = {
      statusCode: 200,
      body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    };
    await routes[key]({ headers: {}, body: {} }, res);
    assert.equal(res.statusCode, 401, `${key} should return 401 without admin auth`);
    assert.equal(res.body.ok, false);
  }
});

test("15) dropshippingRoutes enforces 401 admin auth on readiness and e2e-selftest in production", async () => {
  const { registerDropshippingRoutes } = await importTs(path.join("routes", "dropshippingRoutes.ts"));
  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
  };
  registerDropshippingRoutes(mockApp);

  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    for (const key of ["GET /api/dropshipping/readiness", "POST /api/dropshipping/e2e-selftest"]) {
      const res = {
        statusCode: 200,
        body: null,
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
      };
      await routes[key]({ headers: { host: "t2os.app" }, body: {} }, res);
      assert.equal(res.statusCode, 401, `${key} must reject unauthenticated requests with 401`);
    }
  } finally {
    process.env.NODE_ENV = prevEnv;
  }
});

test("16) t2-studio contentExecutionWorker QA Gate passes strong copy (>=75) and rejects prohibited/weak copy", async () => {
  const { evaluateContentQuality, QA_PASS_THRESHOLD } = await tsImport(
    pathToFileURL("D:/t2-studio/src/server/contentExecutionWorker.ts").href,
    import.meta.url
  );

  const strong = evaluateContentQuality({
    brandName: "كابتن كار",
    title: "احمِ سيارتك مع كابتن كار بطقم النانو 5×1",
    caption:
      "وداعاً لبهتان طلاء السيارة والخدوش اليومية! طقم النانو من كابتن كار يعالج مشكلة تآكل الطلاء بسرعة وسهولة. اطلب الآن عبر واتساب واستفد من الشحن المجاني!",
    visualPrompt: "تصميم إعلاني فاخر لسيارة لامعة بحماية نانو سيراميك بإضاءة استوديو",
    painPoint: "تآكل الطلاء",
  });
  assert.equal(strong.passed, true);
  assert.ok(strong.score >= QA_PASS_THRESHOLD);

  const weak = evaluateContentQuality({
    brandName: "كابتن كار",
    title: "عرض",
    caption: "ضمان 100% شفاء فوري ونهائي",
    visualPrompt: "",
  });
  assert.equal(weak.passed, false);
  assert.ok(weak.score < QA_PASS_THRESHOLD);
  assert.ok(weak.notes.length >= 3);
});

test("17) t2-studio adBudgetManager splits 50% package between Awareness & Sales and evaluates CPA rules", async () => {
  const { buildAdBudgetAllocationPlan, evaluateAdOptimizationRules } = await tsImport(
    pathToFileURL("D:/t2-studio/src/server/adBudgetManager.ts").href,
    import.meta.url
  );

  const planEcom = buildAdBudgetAllocationPlan({
    monthlyPlanPriceEgp: 10000,
    adBudgetRatio: 0.5,
    brandStage: "established",
    businessModel: "ecommerce_store",
    hasWhatsappBusiness: true,
    hasPixel: true,
  });
  assert.equal(planEcom.totalMonthlyAdBudgetEgp, 5000);
  assert.equal(planEcom.awarenessPct, 30);
  assert.equal(planEcom.salesPct, 70);
  assert.ok(planEcom.channels.some((c) => c.channelKey === "sales_store_conversions" && c.metaObjective === "OUTCOME_SALES"));
  assert.ok(planEcom.channels.some((c) => c.channelKey === "sales_whatsapp_agent"));

  const planServices = buildAdBudgetAllocationPlan({
    monthlyPlanPriceEgp: 5000,
    brandStage: "new",
    businessModel: "services_booking",
    hasWhatsappBusiness: false,
  });
  assert.equal(planServices.totalMonthlyAdBudgetEgp, 2500);
  assert.equal(planServices.awarenessPct, 40);
  assert.ok(planServices.readinessWarnings.length >= 1);

  const opt = evaluateAdOptimizationRules([
    { id: "c1", name: "Winner", spendEgp: 200, results: 5, targetCpaEgp: 80, dailyBudgetEgp: 100 },
    { id: "c2", name: "Bleeder", spendEgp: 200, results: 0, targetCpaEgp: 80, dailyBudgetEgp: 100 },
  ]);
  assert.equal(opt.scaledCount, 1);
  assert.equal(opt.pausedCount, 1);
  assert.equal(opt.decisions.find((d) => d.campaignId === "c1").action, "SCALE_UP");
  assert.equal(opt.decisions.find((d) => d.campaignId === "c2").action, "PAUSE");
});

test("18) liveTelemetryService aggregates store visits, cart adds, orders, post/ad insights, and showroom pulse", async () => {
  const { recordLiveEvent, getLiveTelemetrySummary } = await importTs(
    path.join("services", "liveTelemetryService.ts")
  );
  const testBrand = `pulse_unit_${Date.now()}`;
  recordLiveEvent({ source: "storefront_pixel", eventType: "store_visit", brandId: testBrand, summary: "visit 1" });
  recordLiveEvent({ source: "storefront_pixel", eventType: "cart_add", brandId: testBrand, summary: "cart 1" });
  recordLiveEvent({ source: "battah", eventType: "order_created", brandId: testBrand, amountEgp: 950, summary: "ord 1" });
  recordLiveEvent({
    source: "meta_webhook",
    eventType: "post_insights",
    brandId: testBrand,
    summary: "post metrics",
    raw: { reach: 4200, views: 5100, likes: 130, comments: 19 },
  });
  recordLiveEvent({
    source: "t2_studio",
    eventType: "showroom_ready",
    brandId: testBrand,
    summary: "showroom",
    raw: { approvedCount: 3 },
  });

  const summary = getLiveTelemetrySummary(testBrand);
  assert.equal(summary.storeVisits, 1);
  assert.equal(summary.cartAdds, 1);
  assert.equal(summary.orders, 1);
  assert.equal(summary.cartToOrderRatePct, 100);
  assert.equal(summary.socialReach, 4200);
  assert.equal(summary.socialViews, 5100);
  assert.equal(summary.socialLikes, 130);
  assert.equal(summary.socialComments, 19);
  assert.equal(summary.showroomPendingCount, 3);
  assert.ok(summary.executivePulseAr.includes("4,200"));
});

test("19) ecosystemOrchestrationRoutes enforces 401 on studio/admin hooks and validates storefront beacons", async () => {
  const { registerEcosystemOrchestrationRoutes } = await importTs(
    path.join("routes", "ecosystemOrchestrationRoutes.ts")
  );
  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
  };
  registerEcosystemOrchestrationRoutes(mockApp);

  const invoke = async (key, reqOverrides = {}) => {
    const res = {
      statusCode: 200,
      body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; },
    };
    await routes[key]({ headers: {}, body: {}, params: {}, query: {}, ...reqOverrides }, res);
    return res;
  };

  assert.equal((await invoke("POST /api/studio/showroom-ready", { body: { clinicId: "b1" } })).statusCode, 401);
  assert.equal((await invoke("POST /api/admin/brands/:brandId/activate-growth-cycle", { params: { brandId: "b1" } })).statusCode, 401);
  assert.equal((await invoke("POST /api/telemetry/storefront-event", { body: { brandId: "b1", eventType: "invalid_evt" } })).statusCode, 400);
  assert.equal((await invoke("POST /api/telemetry/storefront-event", { body: { brandId: "b1", eventType: "cart_add", productName: "Test" } })).statusCode, 201);
});

test("20) Static contract: t2-studio Meta Ads insights does not return hardcoded fake spend (4250) by default", () => {
  const studioServer = fs.readFileSync("D:/t2-studio/server.ts", "utf8");
  const idx = studioServer.indexOf('app.get("/api/meta/ads/insights"');
  assert.ok(idx > 0);
  const snippet = studioServer.slice(idx, idx + 1500);
  assert.equal(snippet.includes("spend: 4250"), false);
  assert.ok(snippet.includes("connected: false"));
});

test("21) tenantErpRoutes online store order creates admin notification and records live Shadow telemetry", async () => {
  const { registerTenantErpRoutes } = await importTs(path.join("routes", "tenantErpRoutes.ts"));
  const { getLiveTelemetrySummary } = await importTs(path.join("services", "liveTelemetryService.ts"));

  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
    options() {},
  };
  const testSlug = `auto-house-test-${Date.now()}`;
  registerTenantErpRoutes(mockApp, {
    getUnifiedGrowthBrands: () => [
      { id: testSlug, slug: testSlug, name: "أوتو هاوس", phone: "01013372674", whatsapp: "01013372674" },
    ],
    getClonedBrandByIdOrSlug: () => null,
  });

  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  };
  await routes["POST /api/tenant-erp/:slug/orders"](
    {
      params: { slug: testSlug },
      headers: {},
      body: {
        customerDetails: { name: "أحمد علي", phone: "01099887766", address: "مدينة نصر" },
        items: [{ productName: "طقم تيل فرامل سيراميك", quantity: 1, price: 1450 }],
        subtotal: 1450,
        paymentMethod: "cod",
      },
    },
    res
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.ok, true);
  assert.ok(res.body.notification?.message?.includes("أحمد علي"));
  assert.equal(res.body.alerts?.telemetryRecorded, true);
  assert.equal(res.body.alerts?.adminWhatsappQueued, true);
  assert.equal(res.body.alerts?.customerWhatsappQueued, true);

  const pulse = getLiveTelemetrySummary(testSlug);
  assert.ok(pulse.orders >= 1);
  assert.ok(pulse.totalRevenueEgp >= 1450);
});

test("22) Post-subscription market research produces full strategy + 8-item mixed plan and worker invokes generateVideo for reels", async () => {
  const { conductAIMarketResearchAndStrategy } = await tsImport(
    pathToFileURL(path.join(process.cwd(), "routes", "ecosystemOrchestrationRoutes.ts")).href,
    import.meta.url
  );
  const pack = await conductAIMarketResearchAndStrategy({
    brandName: "أوتو هاوس",
    industry: "قطع غيار سيارات",
    city: "القاهرة",
    productsSample: ["تيل فرامل سيراميك", "فلتر زيت أصلي"],
  });

  assert.ok(pack.marketResearch.length > 40);
  assert.ok(pack.painPoints.length >= 5);
  assert.ok(pack.strategicPillars.length >= 4);
  assert.equal(pack.contentPlan.length, 8);
  assert.ok(pack.contentPlan.some((i) => i.type === "reel" || i.type === "video"));
  assert.ok(pack.contentPlan.some((i) => i.type === "image"));

  const studioWorker = await tsImport(
    pathToFileURL("D:/t2-studio/src/server/contentExecutionWorker.ts").href,
    import.meta.url
  );
  let videoCalled = false;
  let savedRecord = null;
  studioWorker.enqueueContentExecutionBatch(
    {
      clinicId: "test_video_clinic",
      brandName: "أوتو هاوس",
      items: [
        {
          title: "ريلز مقارنة تيل الفرامل الأصلي من أوتو هاوس",
          type: "reel",
          caption: "شوف الفرق الحقيقي مع أوتو هاوس في جودة وأمان تيل الفرامل السيراميك. اطلب الآن عبر واتساب أو المتجر!",
          visualPrompt: "مشهد سينمائي لمقارنة تيل فرامل سيراميك داخل ورشة حديثة",
          painPoint: "التأكد من الجودة الأصلية",
        },
      ],
      triggerSource: "unit_test",
    },
    {
      loadBrand: async () => ({ id: "test_video_clinic", name: "أوتو هاوس", industry: "قطع غيار سيارات" }),
      generateVideo: async () => {
        videoCalled = true;
        return "https://cdn.example.com/auto_reel_test.mp4";
      },
      saveContentItem: async (rec) => {
        savedRecord = rec;
        return "vid_doc_1";
      },
    }
  );

  for (let i = 0; i < 40 && !savedRecord; i++) {
    await new Promise((r) => setTimeout(r, 100));
  }
  assert.equal(videoCalled, true);
  assert.equal(savedRecord?.visualUrl, "https://cdn.example.com/auto_reel_test.mp4");
  assert.equal(savedRecord?.qaPassed, true);
});
