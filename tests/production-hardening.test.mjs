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

test("23) No hardcoded fake metrics in brandVault/Jarvis UI & jarvisBrainEngine supports deploy_brand_web_app", () => {
  const brandVaultSrc = fs.readFileSync(path.join(process.cwd(), "services", "brandVault.ts"), "utf8");
  const convMatches = brandVaultSrc.match(/"conversationsCount"\s*:\s*(\d+)/g) || [];
  assert.ok(convMatches.length > 0, "brandVault should contain conversationsCount entries");
  for (const m of convMatches) {
    const val = Number(m.split(":")[1].trim());
    assert.equal(val, 0, `brandVault conversationsCount must be 0 instead of hardcoded ${val}`);
  }

  const constellationSrc = fs.readFileSync(
    path.join(process.cwd(), "components", "ObsidianHolographicConstellation.tsx"),
    "utf8"
  );
  const jarvisModalSrc = fs.readFileSync(
    path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"),
    "utf8"
  );
  assert.equal(/\.postsCount\s*\|\|\s*7/.test(constellationSrc), false, "ObsidianHolographicConstellation must not fallback postsCount to 7");
  assert.equal(/\.weekContentPlan\s*\|\|\s*\[\]\)\.length\s*\|\|\s*7/.test(jarvisModalSrc), false, "JarvisBattleStationModal must not fallback weekContentPlan length to 7");

  const brainSrc = fs.readFileSync(path.join(process.cwd(), "services", "jarvisBrainEngine.ts"), "utf8");
  assert.ok(brainSrc.includes('name: "deploy_brand_web_app"'), "jarvisBrainEngine must declare deploy_brand_web_app tool");
  assert.ok(brainSrc.includes('case "deploy_brand_web_app"'), "jarvisBrainEngine must handle deploy_brand_web_app");
  assert.ok(brainSrc.includes("provisionDedicatedRepoAndVercel"), "jarvisBrainEngine must invoke provisionDedicatedRepoAndVercel");
});

test("24) Persistent storage includes brands/hub configs and preserves external Vercel URLs across Obsidian & Registry", () => {
  const persistSrc = fs.readFileSync(path.join(process.cwd(), "services", "persistentStorage.ts"), "utf8");
  assert.ok(persistSrc.includes('docKey: "t2_brands_vault"') && persistSrc.includes('filename: "brands.json"'));
  assert.ok(persistSrc.includes('docKey: "t2_brand_hub_configs"') && persistSrc.includes('filename: "brand_hub_configs.json"'));

  const obsSrc = fs.readFileSync(path.join(process.cwd(), "services", "obsidianVaultService.ts"), "utf8");
  assert.ok(obsSrc.includes("getPersistentFilePath('brands.json')"));
  assert.ok(obsSrc.includes("savePersistentJson('t2_brands_vault'"));
  assert.ok(obsSrc.includes("resolveBrandExternalOrStoreUrl"));

  const regSrc = fs.readFileSync(path.join(process.cwd(), "services", "brandRegistryService.ts"), "utf8");
  assert.ok(regSrc.includes("seenCanonicalIds") && regSrc.includes("Object.values(state.brands)"), "applyRegistryToBrands must synthesize unmatched state.brands entries");

  const depSrc = fs.readFileSync(path.join(process.cwd(), "services", "dedicatedDeployService.ts"), "utf8");
  assert.ok(depSrc.includes("upsertBrandRegistryEntry"), "dedicatedDeployService must sync deployed URL to brandRegistryService");
  assert.ok(!depSrc.includes("if (depJson?.url) dedicatedLiveUrl ="), "dedicatedDeployService must not overwrite clean alias URL with preview URL");
});

test("25) Ecosystem watchdog handles Agent disconnect webhooks & Daily Brief; Factory enriches visuals & syncs catalog", () => {
  const serverSrc = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");
  assert.ok(serverSrc.includes("ab.brandId || ab.id"), "/api/admin/brands/registry must match Agent brandId field");
  assert.ok(serverSrc.includes("/api/agent/events/disconnect"), "server.ts must expose Agent disconnect webhook");
  assert.ok(serverSrc.includes("/api/admin/watchdog/daily-brief"), "server.ts must expose Daily CEO Brief endpoint");

  const wdSrc = fs.readFileSync(path.join(process.cwd(), "services", "ecosystemWatchdogService.ts"), "utf8");
  assert.ok(wdSrc.includes("handleAgentDisconnectEvent"), "ecosystemWatchdogService must export handleAgentDisconnectEvent");
  assert.ok(wdSrc.includes("buildAndSendDailyCeoBrief"), "ecosystemWatchdogService must export buildAndSendDailyCeoBrief");

  const depSrc = fs.readFileSync(path.join(process.cwd(), "services", "dedicatedDeployService.ts"), "utf8");
  assert.ok(depSrc.includes("/api/studio/generate-product-visual"), "dedicatedDeployService must call Studio product visual endpoint");
  assert.ok(depSrc.includes("/sync-catalog"), "dedicatedDeployService must sync catalog to T2 Agent");
  assert.ok(depSrc.includes("welcomeKit"), "dedicatedDeployService must return Welcome Kit links");

  const jarvisSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.equal(jarvisSrc.includes("358 real chats"), false, "Jarvis must not show hardcoded 358 real chats");
  assert.equal(jarvisSrc.includes("25 Unified Brands"), false, "Jarvis must not show hardcoded 25 Unified Brands");
  assert.ok(jarvisSrc.includes("ObsidianHolographicConstellation") && jarvisSrc.includes("centerCore="), "Jarvis must render Single Obsidian Hero Core with centerCore");
});

test("26) Multi-user tenant sync hashes staff/secondary owner passwords, strips them on GET, and allows login", async () => {
  const { registerTenantErpRoutes } = await importTs(path.join("routes", "tenantErpRoutes.ts"));
  const routes = {};
  const mockApp = {
    get(p, h) { routes[`GET ${p}`] = h; },
    post(p, h) { routes[`POST ${p}`] = h; },
    options() {},
  };
  const testSlug = `multiuser-test-${Date.now()}`;
  registerTenantErpRoutes(mockApp, {
    getUnifiedGrowthBrands: () => [
      { id: testSlug, slug: testSlug, name: "متجر اختبار", phone: "01013372674", whatsapp: "01013372674" },
    ],
    getClonedBrandByIdOrSlug: () => null,
  });

  const makeRes = () => ({
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; return this; },
  });

  const ownerLoginRes = makeRes();
  await routes["POST /api/tenant-auth/login"](
    { headers: {}, body: { brandSlug: testSlug, email: `owner@${testSlug}.t2.app`, password: "T2@372674" } },
    ownerLoginRes
  );
  assert.equal(ownerLoginRes.statusCode, 200);
  assert.equal(ownerLoginRes.body?.ok, true);
  const ownerToken = ownerLoginRes.body?.token;
  assert.ok(ownerToken);

  const syncRes = makeRes();
  await routes["POST /api/tenant-erp/:slug/sync"](
    {
      params: { slug: testSlug },
      headers: { authorization: `Bearer ${ownerToken}` },
      body: {
        state: {
          users: [
            {
              id: "owner_2",
              name: "صاحب البراند الثاني",
              username: "Partner@Example.com",
              password: "OwnerPass2026!",
              role: "admin",
              branch: "main",
              allowedBranches: ["main"],
              permissions: ["dashboard", "users"],
            },
          ],
        },
      },
    },
    syncRes
  );
  assert.equal(syncRes.statusCode, 200);
  assert.equal(syncRes.body?.ok, true);
  assert.equal(syncRes.body?.state?.users?.[0]?.password, undefined);
  assert.equal(syncRes.body?.state?.users?.[0]?.passwordHash, undefined);
  assert.equal(syncRes.body?.state?.users?.[0]?.hasPassword, true);

  const getRes = makeRes();
  await routes["GET /api/tenant-erp/:slug/state"](
    { params: { slug: testSlug }, headers: { authorization: `Bearer ${ownerToken}` } },
    getRes
  );
  assert.equal(getRes.statusCode, 200);
  assert.equal(getRes.body?.scope, "admin");
  assert.equal(getRes.body?.state?.users?.[0]?.username, "partner@example.com");
  assert.equal(getRes.body?.state?.users?.[0]?.password, undefined);
  assert.equal(getRes.body?.state?.users?.[0]?.passwordHash, undefined);

  const partnerLoginRes = makeRes();
  await routes["POST /api/tenant-auth/login"](
    { headers: {}, body: { brandSlug: testSlug, email: "partner@example.com", password: "OwnerPass2026!" } },
    partnerLoginRes
  );
  assert.equal(partnerLoginRes.statusCode, 200);
  assert.equal(partnerLoginRes.body?.ok, true);
  assert.equal(partnerLoginRes.body?.user?.role, "admin");
  assert.equal(partnerLoginRes.body?.user?.username, "partner@example.com");

  const tempJson = path.join(process.cwd(), "data", "tenant_erp_state", `${testSlug}.json`);
  if (fs.existsSync(tempJson)) fs.unlinkSync(tempJson);
});

test("27) brandIdentityNormalizer unifies slug/underscore variants & postgresService handles graceful degradation", async () => {
  const { toCanonicalSlug, toCanonicalAgentId, areBrandIdsEquivalent, findMatchingBrandRecord } = await importTs(
    path.join("services", "brandIdentityNormalizer.ts")
  );
  assert.equal(toCanonicalSlug("Al_Genedy"), "al-genedy");
  assert.equal(toCanonicalAgentId("al-genedy"), "al_genedy");
  assert.equal(areBrandIdsEquivalent("al-genedy", "al_genedy"), true);
  assert.equal(areBrandIdsEquivalent("mm-shoes", "other-brand"), false);

  const matched = findMatchingBrandRecord(
    [{ id: "al_genedy", slug: "al-genedy", name: "الجنيدي" }],
    "al-genedy"
  );
  assert.equal(matched?.name, "الجنيدي");

  const { pingPostgres } = await importTs(path.join("services", "postgresService.ts"));
  const pgStatus = await pingPostgres();
  assert.equal(typeof pgStatus.configured, "boolean");
});

test("28) Trial planMode='trial_3' generates strictly 2 image posts + 1 reel while paid default returns 8 items", async () => {
  const prevGeminiKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "";
  try {
    const { conductAIMarketResearchAndStrategy } = await importTs(path.join("routes", "ecosystemOrchestrationRoutes.ts"));
    const trialPack = await conductAIMarketResearchAndStrategy({
      brandName: "متجر التجربة السريع",
      industry: "أحذية وإكسسوارات",
      planMode: "trial_3",
    });
    assert.equal(trialPack.contentPlan.length, 3);
    assert.equal(trialPack.contentPlan.filter((i) => i.type === "image").length, 2);
    assert.equal(trialPack.contentPlan.filter((i) => i.type === "reel").length, 1);

    const paidPack = await conductAIMarketResearchAndStrategy({
      brandName: "متجر التجربة السريع",
      industry: "أحذية وإكسسوارات",
    });
    assert.equal(paidPack.contentPlan.length, 8);
  } finally {
    process.env.GEMINI_API_KEY = prevGeminiKey || "";
  }
});

test("29) Multi-Tenant URL builder, ClientPortal SSO, 1-revision trial limit & 5,000 EGP min upgrade policy", async () => {
  const { buildFlagshipTenantUrl } = await importTs(path.join("services", "tenantAppRenderer.ts"));
  const storeUrl = buildFlagshipTenantUrl("demo_brand", "products_erp");
  const bookUrl = buildFlagshipTenantUrl("demo_clinic", "services_booking");
  assert.ok(storeUrl.includes("/s/demo-brand"), `Expected /s/demo-brand, got ${storeUrl}`);
  assert.ok(bookUrl.includes("/b/demo-clinic"), `Expected /b/demo-clinic, got ${bookUrl}`);

  const { registerClientPortalRoutes } = await importTs(path.join("routes", "clientPortalRoutes.ts"));
  const { signClientPortalToken } = await importTs(path.join("routes", "tenantErpRoutes.ts"));
  const portalSrc = fs.readFileSync(path.join(process.cwd(), "routes", "clientPortalRoutes.ts"), "utf8");
  assert.ok(portalSrc.includes("ssoStoreAdminUrl"), "clientPortalRoutes must expose ssoStoreAdminUrl");
  assert.ok(portalSrc.includes("maxRevisions = isTrial ? 1 :"), "clientPortalRoutes must limit trial revisions to 1 per post");
  const { SAAS_PLANS } = await importTs(path.join("services", "saasPlansService.ts"));
  assert.equal(SAAS_PLANS.trial_7d.maxRevisionsPerPost, 1);
  assert.equal(SAAS_PLANS.growth_5000.maxRevisionsPerPost, 2);
  assert.equal(SAAS_PLANS.pro_10000.maxRevisionsPerPost, 3);
  assert.equal(SAAS_PLANS.enterprise_20000.maxRevisionsPerPost, 5);
  assert.equal(SAAS_PLANS.sovereign_50000.maxRevisionsPerPost, 10);
  assert.ok(typeof registerClientPortalRoutes === "function" && typeof signClientPortalToken("demo-brand") === "string");

  const pricingSrc = fs.readFileSync(path.join(process.cwd(), "components", "Pricing.tsx"), "utf8");
  assert.equal(pricingSrc.includes("'tier_2500'"), false, "Pricing.tsx must set 5,000 EGP (tier_5000) as minimum tier");
  const paymobSrc = fs.readFileSync(path.join(process.cwd(), "routes", "paymobRoutes.ts"), "utf8");
  assert.ok(paymobSrc.includes("minUpgradeEgp: 5000"), "Paymob checkout route must enforce 5,000 EGP minimum upgrade");
});

test("30) Status report exposes ecosystem components, Redis/Postgres checks, disk stats & backup cadence", async () => {
  const { buildPublicStatusReport } = await importTs(path.join("routes", "statusPageRoutes.ts"));
  const report = await buildPublicStatusReport();
  assert.equal(report.ok, true);
  assert.ok(Array.isArray(report.components) && report.components.length >= 6);
  const ids = report.components.map((c) => c.id);
  assert.ok(ids.includes("ez_zel") && ids.includes("postgres") && ids.includes("redis"));
  assert.equal(report.infrastructure.backup.intervalHours, 6);
});

test("31) AI Cost Ledger accurately tracks usage costs and computes 50% platform net margins", async () => {
  const { estimateAiOperationCostUsd, recordAiCostEvent, getBrandAiCostMarginsSummary } = await importTs(
    path.join("services", "aiCostLedgerService.ts")
  );
  const vidCost = estimateAiOperationCostUsd({ brandId: "b1", service: "t2-studio", operation: "video", model: "veo-3.1" });
  const imgCost = estimateAiOperationCostUsd({ brandId: "b1", service: "t2-studio", operation: "image", model: "gemini-flash-image" });
  assert.ok(vidCost >= 0.25 && imgCost > 0.01);

  const testSlug = `cost-ledger-e2e-${Date.now()}`;
  await recordAiCostEvent({ brandId: testSlug, service: "t2-studio", operation: "image", model: "gemini-2.5-flash-image" });
  const summary = await getBrandAiCostMarginsSummary(
    [{ id: testSlug, slug: testSlug, name: "براند تكاليف", planAmount: 5000, subscriptionStatus: "active" }],
    30
  );
  const row = summary.perBrand.find((r) => r.brandId === testSlug);
  assert.ok(row, "Ledger must return brand margin row");
  assert.equal(row.netSystemRevenueEgp, 2500);
  assert.ok(row.totalAiCostEgp > 0);
  assert.ok(row.netMarginEgp < 2500 && row.netMarginEgp > 2400);
});

test("32) transliterateArabicToSlug produces clean Latin slugs & server.ts scopes /api/cloner/brands and /api/obsidian/graph", async () => {
  const { transliterateArabicToSlug, toCanonicalSlug } = await importTs(
    path.join("services", "brandIdentityNormalizer.ts")
  );
  const arSlug = transliterateArabicToSlug("مؤسسة النور للتوريدات");
  assert.ok(arSlug.length >= 6, `Expected meaningful transliterated slug, got ${arSlug}`);
  assert.notEqual(arSlug, "qa");
  assert.equal(toCanonicalSlug("مؤسسة النور للتوريدات"), arSlug);

  const serverSrc = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");
  assert.ok(
    serverSrc.includes('app.get("/api/cloner/brands"') &&
      serverSrc.includes("req.query.brandId") &&
      serverSrc.includes("verifyAdminRequest(req)"),
    "GET /api/cloner/brands must require admin auth unless scoped by brandId"
  );
  assert.ok(
    serverSrc.includes('app.get("/api/obsidian/graph"') &&
      serverSrc.includes("req.query.brandId") &&
      serverSrc.includes("verifyAdminRequest(req)"),
    "GET /api/obsidian/graph must require admin auth unless scoped by brandId"
  );
});

test("33) Trial approve-post persists revisionCount across getUnifiedGrowthBrands and enforces 429 on 2nd revision", async () => {
  const prevTenantSecret = process.env.TENANT_AUTH_SECRET;
  if (!prevTenantSecret) {
    process.env.TENANT_AUTH_SECRET = `test-secret-${Date.now()}`;
  }
  const {
    persistBrandUpdateAcrossEcosystem,
    getUnifiedGrowthBrands,
    deleteBrandVaultState,
  } = await importTs(path.join("services", "obsidianVaultService.ts"));
  const { upsertBrandRegistryEntry, deleteBrandRegistryEntry } = await importTs(
    path.join("services", "brandRegistryService.ts")
  );
  const { buildOmniChannelWeekPlan } = await importTs(
    path.join("services", "titoStudioFirestoreBridge.ts")
  );
  const { registerClientPortalRoutes } = await importTs(path.join("routes", "clientPortalRoutes.ts"));
  const { signClientPortalToken } = await importTs(path.join("routes", "tenantErpRoutes.ts"));

  const testSlug = `trial-rev-cap-${Date.now()}`;
  const futureTrialEnd = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
  const initialPlan = buildOmniChannelWeekPlan({
    id: testSlug,
    slug: testSlug,
    name: "براند اختبار التعديل",
    businessType: "تجارة إلكترونية",
    phone: "01099887755",
    existingPlan: [{ contentType: "Reel فيديو", hook: "خطاف تجريبي أول" }],
    isTrial: true,
  });
  assert.equal(initialPlan.filter((i) => i.mediaFormat === "image").length, 2, "Trial must contain strictly 2 image posts");
  assert.equal(initialPlan.filter((i) => i.mediaFormat === "video").length, 1, "Trial must contain strictly 1 video reel");

  try {
    persistBrandUpdateAcrossEcosystem(testSlug, {
      id: testSlug,
      slug: testSlug,
      name: "براند اختبار التعديل",
      businessType: "تجارة إلكترونية",
      phone: "01099887755",
      subscriptionStatus: "trial",
      planId: "trial_7d",
      trialEndsAt: futureTrialEnd,
      weekContentPlan: initialPlan,
    });
    upsertBrandRegistryEntry(testSlug, {
      slug: testSlug,
      name: "براند اختبار التعديل",
      businessType: "تجارة إلكترونية",
      planId: "trial_7d",
      lifecycleStage: "trial",
      subscriptionStatus: "trial",
    });

    const loadedBefore = getUnifiedGrowthBrands().find((b) => b.slug === testSlug || b.id === testSlug);
    assert.ok(loadedBefore, "Test trial brand must resolve from getUnifiedGrowthBrands");
    assert.equal(loadedBefore.weekContentPlan.length, 3, "Trial weekContentPlan must contain strictly 3 items");

    const routes = {};
    const mockApp = {
      get(p, h) { routes[`GET ${p}`] = h; },
      post(p, h) { routes[`POST ${p}`] = h; },
    };
    registerClientPortalRoutes(mockApp, {
      getServerAI: () => null,
      getRealEcosystemStats: () => ({}),
      synthesizeSovereignSpeech: async () => null,
    });

    const portalToken = signClientPortalToken(testSlug);
    const callApprovePost = async (feedback) => {
      const res = {
        statusCode: 200,
        body: null,
        status(c) { this.statusCode = c; return this; },
        json(b) { this.body = b; return this; },
      };
      await routes["POST /api/client-portal/:slug/approve-post"](
        {
          params: { slug: testSlug },
          headers: { "x-portal-token": portalToken },
          query: {},
          body: { postIndex: 0, decision: "revision_requested", feedback },
        },
        res
      );
      return res;
    };

    const first = await callApprovePost("تعديل أول");
    assert.equal(first.statusCode, 200);
    assert.equal(first.body.ok, true);
    assert.equal(first.body.post?.revisionCount, 1);

    const reloaded = getUnifiedGrowthBrands().find((b) => b.slug === testSlug || b.id === testSlug);
    assert.equal(reloaded?.weekContentPlan?.[0]?.revisionCount, 1, "revisionCount must persist across getUnifiedGrowthBrands");

    const second = await callApprovePost("تعديل ثاني");
    assert.equal(second.statusCode, 429, `Expected 429 on 2nd revision, got ${second.statusCode}`);
    assert.equal(second.body.limitReached, true);
  } finally {
    deleteBrandVaultState(testSlug);
    await deleteBrandRegistryEntry(testSlug);
    if (prevTenantSecret === undefined) delete process.env.TENANT_AUTH_SECRET;
    else process.env.TENANT_AUTH_SECRET = prevTenantSecret;
  }
});

test("34) Legacy admin_managed brands are tagged separately from public_signup & new Jarvis cross-app actions are admin-gated", async () => {
  const { getUnifiedGrowthBrands } = await importTs(path.join("services", "obsidianVaultService.ts"));
  const { CORE_ADMIN_MANAGED_IDS } = await importTs(path.join("services", "brandRegistryService.ts"));
  const unified = getUnifiedGrowthBrands();
  const legacyBrands = unified.filter((b) => CORE_ADMIN_MANAGED_IDS.has(String(b.canonicalId || b.id)));
  assert.ok(legacyBrands.length > 0, "Expected seeded legacy brands to be present in unified brands");
  for (const lb of legacyBrands) {
    assert.equal(lb.accountOrigin, "admin_managed", `Expected legacy brand ${lb.id} to have accountOrigin=admin_managed`);
  }

  const serverSrc = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");
  for (const requiredAction of [
    "TOGGLE_AGENT_BOT",
    "SEND_AGENT_WHATSAPP_MESSAGE",
    "UPDATE_BRAND_LIFECYCLE_AND_PLAN",
  ]) {
    assert.ok(serverSrc.includes(`'${requiredAction}'`), `Expected ${requiredAction} in ADMIN_ONLY_JARVIS_ACTIONS`);
  }

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(!modalSrc.includes("jarvisWorkspaceMode"), "Dual Jarvis core mode toggle should be removed in favor of single Obsidian Hero Core");
});

test("35) Deprecated 2500 EGP tier removed, minimum 5000 EGP enforced, Keep-Alive embeds, Paymob affiliate auto-credit & Studio revision callback wired", async () => {
  const { SAAS_PLANS } = await importTs(path.join("services", "saasPlansService.ts"));
  const { PAYMOB_PLANS } = await importTs(path.join("services", "paymobService.ts"));
  assert.equal((SAAS_PLANS).starter_2500, undefined, "starter_2500 must be removed from SAAS_PLANS");
  assert.equal((PAYMOB_PLANS).tier_2500, undefined, "tier_2500 must be removed from PAYMOB_PLANS");
  assert.equal(SAAS_PLANS.growth_5000.priceEgp, 5000, "Minimum paid SaaS plan must be 5,000 EGP");

  const portalSrc = fs.readFileSync(path.join(process.cwd(), "routes", "clientPortalRoutes.ts"), "utf8");
  assert.ok(portalSrc.includes("/api/webhooks/studio-revision-complete"), "Studio revision completion callback must exist");

  const paymobRoutesSrc = fs.readFileSync(path.join(process.cwd(), "routes", "paymobRoutes.ts"), "utf8");
  assert.ok(paymobRoutesSrc.includes("t2_affiliate_commissions.json"), "Paymob webhook must credit affiliate commissions");

  const vaultSrc = fs.readFileSync(path.join(process.cwd(), "services", "obsidianVaultService.ts"), "utf8");
  assert.ok(vaultSrc.includes("consumeBrandMonthlyQuota"), "TRIGGER_STUDIO_GENERATION must enforce monthly quota");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(modalSrc.includes("studioEmbed.open ? 'flex' : 'hidden'"), "Studio embed iframe must stay Keep-Alive");
  assert.ok(modalSrc.includes("agentEmbed.open ? 'flex' : 'hidden'"), "Agent embed iframe must stay Keep-Alive");
});

test("36) Factory modal has unified 5000+ pricing, Ribbon excludes admin_managed MRR, and speechService streams long replies cleanly", () => {
  const onboardingSrc = fs.readFileSync(path.join(process.cwd(), "components", "chat", "ClientOnboardingModal.tsx"), "utf8");
  assert.equal(onboardingSrc.includes("18,000"), false, "Factory modal must not display legacy 18,000 price");
  assert.equal(onboardingSrc.includes("28,000"), false, "Factory modal must not display legacy 28,000 price");
  assert.equal(/\bamount:\s*2500\b/.test(onboardingSrc), false, "Factory modal must not include deprecated 2500 plan");
  assert.equal(onboardingSrc.includes("باقة الانطلاق (2,500"), false, "Factory modal must not display deprecated 2,500 tier");
  assert.ok(onboardingSrc.includes("5,000 ج"), "Factory modal must use unified 5,000+ pricing");

  const ribbonSrc = fs.readFileSync(path.join(process.cwd(), "components", "AdminGovernanceRibbon.tsx"), "utf8");
  assert.ok(ribbonSrc.includes("admin_managed"), "AdminGovernanceRibbon must separate admin_managed from public MRR");
  assert.ok(ribbonSrc.includes("/api/system/real-financials"), "AdminGovernanceRibbon must read /api/system/real-financials");

  const speechSrc = fs.readFileSync(path.join(process.cwd(), "services", "speechService.ts"), "utf8");
  assert.ok(speechSrc.includes("playShadowVoiceStreaming"), "speechService must stream long replies with Gemini Human TTS");
  assert.equal(speechSrc.includes("SpeechSynthesisUtterance"), false, "speechService must NOT fall back to robotic browser SpeechSynthesisUtterance");
});

test("37) Modularized Paymob/Registry architecture, 8 canonical dogfooding brands, and Khedr dashboard split", () => {
  const serverSrc = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");
  assert.ok(serverSrc.includes("registerPaymobRoutes"), "server.ts must delegate Paymob endpoints to modular paymobRoutes");
  assert.ok(serverSrc.includes("accountOrigin: b.accountOrigin"), "registry API must expose accountOrigin so Top Ribbon excludes admin_managed MRR");

  const paymobRoutesSrc = fs.readFileSync(path.join(process.cwd(), "routes", "paymobRoutes.ts"), "utf8");
  assert.ok(paymobRoutesSrc.includes("/api/payments/paymob/webhook"), "modular paymobRoutes must handle Paymob webhook");

  const registrySrc = fs.readFileSync(path.join(process.cwd(), "services", "brandRegistryService.ts"), "utf8");
  const requiredBrands = [
    "al_shomoukh_dentistry",
    "crystal_teeth",
    "alkhalig_dental",
    "socotra_dental",
    "dental_district",
    "mecca_dental",
    "auto_house",
    "al_genedy",
  ];
  for (const id of requiredBrands) {
    assert.ok(registrySrc.includes(`canonicalId: '${id}'`), `CORE_ACTIVE_BRANDS_SEED must contain dogfooding brand ${id}`);
  }
  assert.ok(registrySrc.includes("https://book.t2os.app/b/"), "Clinic brands must use canonical https://book.t2os.app/b/ URLs");
  assert.ok(registrySrc.includes("https://t2-tenant-auto-house.vercel.app"), "auto_house must use canonical tenant URL");
  assert.ok(registrySrc.includes("https://elgenedy.com"), "al_genedy must use canonical https://elgenedy.com URL");

  const geminiSrc = fs.readFileSync(path.join(process.cwd(), "services", "geminiService.ts"), "utf8");
  assert.equal(geminiSrc.includes("باقة الانطلاق الفضي (2,500"), false, "geminiService prompt must not advertise removed 2,500 EGP tier");

  const khedrHtmlPath = path.join("D:\\khedr-bot", "public", "dashboard.html");
  if (fs.existsSync(khedrHtmlPath)) {
    const htmlLines = fs.readFileSync(khedrHtmlPath, "utf8").split(/\r?\n/).length;
    assert.ok(htmlLines < 5000, `khedr dashboard.html should stay modular under 5000 lines (got ${htmlLines})`);
    assert.ok(fs.existsSync(path.join("D:\\khedr-bot", "public", "js", "dashboard.js")), "khedr dashboard.js must exist");
    assert.ok(fs.existsSync(path.join("D:\\khedr-bot", "public", "css", "dashboard.css")), "khedr dashboard.css must exist");
  }
});

test("38) Voice/Mic anti-echo & single-prosody TTS, restored QA/Catalog/Ads HUD, and full brand portfolio seeded", () => {
  const speechSrc = fs.readFileSync(path.join(process.cwd(), "services", "speechService.ts"), "utf8");
  assert.ok(speechSrc.includes("export const isShadowVoicePlaying"), "speechService must export isShadowVoicePlaying");
  assert.ok(speechSrc.includes(".length > 950"), "speechService must keep normal replies under 950 chars in a single TTS call");
  assert.equal(speechSrc.includes("[.!؟،؛\\n]"), false, "playShadowVoiceStreaming must NOT split on Arabic commas (causes choppy multi-voice audio)");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(modalSrc.includes("dedupeAndroidSpeechResults"), "JarvisBattleStationModal must dedupe Android Chrome speech transcripts");
  assert.ok(modalSrc.includes("isLikelySpeakerEcho"), "JarvisBattleStationModal must filter speaker echo");
  assert.ok(modalSrc.includes("isShadowVoicePlaying()"), "JarvisBattleStationModal must poll real audio playback state before restarting mic");
  assert.ok(modalSrc.includes("setIsCatalogModalOpen(true)"), "JarvisBattleStationModal must expose Unified Catalog trigger");
  assert.ok(modalSrc.includes("content_qa_monitor"), "JarvisBattleStationModal must expose Content QA Monitor");
  assert.ok(modalSrc.includes("/api/growth/optimize-loop"), "JarvisBattleStationModal must expose Ads ROAS optimization");

  const registrySrc = fs.readFileSync(path.join(process.cwd(), "services", "brandRegistryService.ts"), "utf8");
  for (const id of ["clean_master", "tito_media", "crypto_bel_arabi", "besho", "alkhedr_car_rental", "battah_system"]) {
    assert.ok(registrySrc.includes(`canonicalId: '${id}'`), `CORE_ACTIVE_BRANDS_SEED must contain portfolio brand ${id}`);
  }
});

test("39) Live-QA UX fixes: single Obsidian selection dock, persistent Jarvis reply, fast TTS summary, 1-row mobile header & 5,000+ OS catalog", () => {
  const obsidianSrc = fs.readFileSync(path.join(process.cwd(), "components", "ObsidianHolographicConstellation.tsx"), "utf8");
  assert.ok(obsidianSrc.includes("isCompactCanvas"), "ObsidianHolographicConstellation must clamp mobile node labels cleanly");
  assert.equal(obsidianSrc.includes("setHoveredNode({\n            brand: item.brand"), false, "Clicking an Obsidian node must NOT spawn a second duplicate popover");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(modalSrc.includes("lastJarvisReply"), "JarvisBattleStationModal must persist lastJarvisReply visibly");
  assert.ok(modalSrc.includes("buildConciseSpokenSummary"), "JarvisBattleStationModal must use concise voice summary for faster TTS");
  assert.ok(modalSrc.includes("flex-nowrap sm:flex-wrap") && modalSrc.includes("overflow-x-auto"), "Mobile BattleStation header must stay 1 horizontal row");

  const dockSrc = fs.readFileSync(path.join(process.cwd(), "components", "jarvis", "JarvisMasterVoiceDock.tsx"), "utf8");
  assert.ok(dockSrc.includes("lastReplyText") && dockSrc.includes("handleToggleListening"), "JarvisMasterVoiceDock must show reply card & interactive orb mic button");

  const vaultSrc = fs.readFileSync(path.join(process.cwd(), "services", "brandVault.ts"), "utf8");
  assert.equal(vaultSrc.includes("1500 ج.م / شهر"), false, "t2_digital_os catalog must not carry stale 1500 EGP price");
  assert.equal(vaultSrc.includes("3500 ج.م / شهر"), false, "t2_digital_os catalog must not carry stale 3500 EGP price");
  assert.ok(vaultSrc.includes("5,000 ج.م / شهر"), "t2_digital_os catalog must start paid tiers at 5,000 EGP");

  const routesSrc = fs.readFileSync(path.join(process.cwd(), "components", "AppRoutes.tsx"), "utf8");
  assert.ok(routesSrc.includes("!isAuthReady"), "AppRoutes must wait for auth hydration before redirecting /chat");
});

test("40) New-client Mystery Shopper 6 fixes: domain image isolation, auto-fill wizard, e-commerce vs service separation & clean white-label Portal", () => {
  const hydSrc = fs.readFileSync(path.join(process.cwd(), "services", "industryHydrationService.ts"), "utf8");
  assert.ok(hydSrc.includes("export function getIndustryHeroImage"), "industryHydrationService must export getIndustryHeroImage");
  assert.equal(/أزياء\|ملابس\|موض\|شوز\|أحذية\|fashion\|clothes\|store\|متجر/.test(hydSrc), false, "Clothing image regex must NOT match generic 'store' or 'متجر'");
  assert.ok(hydSrc.includes("عطر العود الملكي"), "industryHydrationService must provide dedicated perfume catalog & images");

  const clonerSrc = fs.readFileSync(path.join(process.cwd(), "services", "appClonerCrawlerService.ts"), "utf8");
  const bridgeSrc = fs.readFileSync(path.join(process.cwd(), "services", "titoStudioFirestoreBridge.ts"), "utf8");
  assert.equal(clonerSrc.includes("t2-client.vercel.app"), false, "appClonerCrawlerService must use canonical t2os.app URLs");
  assert.equal(bridgeSrc.includes("t2-growth-os.vercel.app"), false, "titoStudioFirestoreBridge must use canonical t2os.app URLs");
  assert.ok(clonerSrc.includes("isEcommerceProductDomain"), "appClonerCrawlerService must separate products_erp from services_booking copy");
  assert.ok(bridgeSrc.includes("isProductsStore"), "titoStudioFirestoreBridge must separate products_erp captions from booking deposit copy");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(modalSrc.includes("setDetectedVisitorBrand"), "VISITOR_DIAGNOSTIC_UPDATE must populate detectedVisitorBrand");
  assert.ok(modalSrc.includes("isMasterAdmin && !adminPreviewVisitor ?"), "Admin action strip must stay hidden during adminPreviewVisitor mode");
  assert.ok(modalSrc.includes("Pinned Header Controls"), "BattleStation close X control must stay pinned outside horizontal overflow strip");

  const wizSrc = fs.readFileSync(path.join(process.cwd(), "components", "chat", "VisitorIntelligenceOnboarding.tsx"), "utf8");
  assert.ok(wizSrc.includes("initialPhone = ''"), "VisitorIntelligenceOnboarding must accept & prefill initialPhone");
  assert.equal(wizSrc.includes("وضع الماستر تيتو"), false, "VisitorIntelligenceOnboarding must not leak Master Tito button inside visitor wizard");

  const brainSrc = fs.readFileSync(path.join(process.cwd(), "services", "jarvisBrainEngine.ts"), "utf8");
  assert.ok(brainSrc.includes("الإجمالي ${p.priceEgp"), "Dynamic plans prompt must state exact total monthly EGP price");
  assert.ok(brainSrc.includes("استوديو المحتوى") && brainSrc.includes("وكيل الواتساب الذكي"), "Non-admin output sanitizer must rewrite internal platform names");

  const vaultSvcSrc = fs.readFileSync(path.join(process.cwd(), "services", "obsidianVaultService.ts"), "utf8");
  assert.equal(vaultSvcSrc.includes("clinic.selectedMetaPage || existing.metaConnected"), false, "obsidianVaultService must check selectedMetaPage?.id instead of empty object truthiness");

  const portalSrc = fs.readFileSync(path.join(process.cwd(), "components", "ClientPortalView.tsx"), "utf8");
  assert.equal(/تيتو\s*(?:ا|إ)?ستوديو|تيتو\s*(?:أ|ا)?جنت/.test(portalSrc), false, "ClientPortalView must use clean white-label names");
  assert.ok(portalSrc.includes("brand.metaConnected || brand.metaPageId") && portalSrc.includes("revExhausted"), "ClientPortalView must require metaPageId/metaConnected & guard exhausted revisions without prompt()");
});

test("41) Studio strict QA media gate & zero Pollinations watermark, rotating Gemini research, ERP full teardown, SSO + ownerCredentials & Store vs Dropshipping separation", () => {
  const studioWorker = fs.readFileSync(path.join("D:\\t2-studio", "src", "server", "contentExecutionWorker.ts"), "utf8");
  assert.ok(studioWorker.includes("hardMediaBlocked") && studioWorker.includes("requiresVisualAsset"), "Studio QA Gate must reject non-text items with empty visualUrl");
  assert.equal(studioWorker.includes("showroomSentAt: passed ? new Date().toISOString() : undefined"), false, "Studio saveContentItem must never write undefined showroomSentAt to Firestore");

  const studioSrv = fs.readFileSync(path.join("D:\\t2-studio", "server.ts"), "utf8");
  assert.equal(studioSrv.includes("image.pollinations.ai"), false, "generateStudioImageAsset must not fall back to watermarked pollinations.ai");
  assert.ok(studioSrv.includes("renderBrandedSocialDesign") && studioSrv.includes("ffmpeg"), "Studio must render branded Sharp composites and FFmpeg MP4 reels as resilient Tier-2 fallback");

  const studioShowroom = fs.readFileSync(path.join("D:\\t2-studio", "src", "components", "portal", "ClientPortalView.tsx"), "utf8");
  assert.ok(studioShowroom.includes("<video") && studioShowroom.includes("qaScore"), "Studio Showroom must play .mp4 reels and show QA score badge");

  const orchSrc = fs.readFileSync(path.join(process.cwd(), "routes", "ecosystemOrchestrationRoutes.ts"), "utf8");
  assert.ok(orchSrc.includes("loadGeminiKeysFromEnv"), "conductAIMarketResearchAndStrategy must rotate all Gemini keys from geminiKeyPool");

  const erpSvc = fs.readFileSync(path.join(process.cwd(), "services", "tenantErpStoreService.ts"), "utf8");
  const serverSrc = fs.readFileSync(path.join(process.cwd(), "server.ts"), "utf8");
  assert.ok(erpSvc.includes("export async function deleteTenantErpState"), "tenantErpStoreService must export deleteTenantErpState");
  assert.ok(serverSrc.includes("deleteTenantErpState"), "DELETE /api/admin/brands/:slug must purge Postgres and Firestore ERP shards");

  const vaultSrc = fs.readFileSync(path.join(process.cwd(), "services", "obsidianVaultService.ts"), "utf8");
  assert.ok(vaultSrc.includes("enableDropshipping"), "PROVISION_VISITOR_TRIAL must explicitly set enableDropshipping flag");

  const portalRoutes = fs.readFileSync(path.join(process.cwd(), "routes", "clientPortalRoutes.ts"), "utf8");
  assert.ok(portalRoutes.includes("ownerCredentials") && portalRoutes.includes("if (accessCheck.ok)"), "Client portal must gate ownerCredentials behind accessCheck.ok");

  const battahSidebar = fs.readFileSync("C:\\Users\\ahmed\\.gemini\\antigravity\\brain\\036fb332-c89d-4066-97a1-2cb5a627f42b\\scratch\\battah-repo\\components\\Sidebar.tsx", "utf8");
  assert.ok(battahSidebar.includes("isDropshippingStore") && battahSidebar.includes("Section.Dropshipping"), "Standard e-commerce storefront sidebar must hide Dropshipping unless enabled");
});

test("42) Final touches: Jarvis Home route on /, 4-persona greetings, Tito Digital SEO/GEO (zero 2,500 & zero onrender), and Studio local MP4 + rotating Veo keys", () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf8");
  assert.ok(indexHtml.includes("تيتو ديجيتال للحلول الرقمية وتطوير الأعمال"), "index.html must highlight Tito Digital Arabic full brand identity");
  assert.equal(indexHtml.includes("2,500 و5,000"), false, "index.html JSON-LD must not carry stale 2,500 pricing");
  assert.equal(indexHtml.includes("ez-zel.onrender.com"), false, "index.html must not contain legacy onrender URLs");

  const robotsTxt = fs.readFileSync(path.join(process.cwd(), "public", "robots.txt"), "utf8");
  const llmsTxt = fs.readFileSync(path.join(process.cwd(), "public", "llms.txt"), "utf8");
  assert.ok(robotsTxt.includes("https://t2os.app/sitemap.xml"), "robots.txt must point to t2os.app sitemap");
  assert.equal(robotsTxt.includes("onrender.com"), false, "robots.txt must not carry legacy onrender URL");
  assert.ok(llmsTxt.includes("https://t2os.app/") && !llmsTxt.includes("onrender.com"), "llms.txt must use canonical t2os.app URLs");

  const routesSrc = fs.readFileSync(path.join(process.cwd(), "components", "AppRoutes.tsx"), "utf8");
  assert.ok(routesSrc.includes("isHomePage={true}") && routesSrc.includes('path="/"'), "AppRoutes must mount JarvisBattleStationModal directly on /");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(
    modalSrc.includes("autoGreetedKeyRef") &&
      modalSrc.includes("أهلاً بيك في منظومة T2OS من تيتو ديجيتال") &&
      modalSrc.includes("أهلاً بيك من جديد في أسبوع التجربة المجانية") &&
      modalSrc.includes("أهلاً بيك يا شريك النجاح") &&
      modalSrc.includes("أهلاً يا ماستر تيتو!"),
    "JarvisBattleStationModal must support auto-greeting across all 4 personas"
  );

  const brainSrc = fs.readFileSync(path.join(process.cwd(), "services", "jarvisBrainEngine.ts"), "utf8");
  assert.ok(brainSrc.includes('else if (persona === "trial")') && brainSrc.includes('else if (persona === "client")'), "jarvisBrainEngine must split trial and client system prompts cleanly");

  const studioSrv = fs.readFileSync(path.join("D:\\t2-studio", "server.ts"), "utf8");
  assert.ok(studioSrv.includes("saveStudioMediaLocal") && studioSrv.includes("videoOperationKeyMap"), "t2-studio server must serve local MP4 reels cleanly and rotate Gemini keys for Veo endpoints");

  const socialRenderer = fs.readFileSync(path.join("D:\\t2-studio", "src", "server", "socialDesignRenderer.ts"), "utf8");
  assert.ok(socialRenderer.includes("إصدار 2026") && socialRenderer.includes("اطلب الآن"), "socialDesignRenderer must use domain-aware badges and CTAs");
});

test("43) 360° Fullscreen Obsidian, touch rotation, SpaceCanvas backdrop, wake-word Jarvis, PWA persistence & post-generation brand/visual fixes", () => {
  const obsidianSrc = fs.readFileSync(path.join(process.cwd(), "components", "ObsidianHolographicConstellation.tsx"), "utf8");
  assert.ok(
    obsidianSrc.includes("touchstart") && obsidianSrc.includes("touchmove") && obsidianSrc.includes("touchAction: 'none'"),
    "ObsidianHolographicConstellation must support full mobile touch 360 rotation & pinch zoom"
  );
  assert.ok(obsidianSrc.includes("toggleFullscreen") && obsidianSrc.includes("compact ? 'min-h-0'"), "ObsidianHolographicConstellation must support fullscreen & compact zero-overlap mode");

  const modalSrc = fs.readFileSync(path.join(process.cwd(), "components", "JarvisBattleStationModal.tsx"), "utf8");
  assert.ok(modalSrc.includes("extractWakeWordCommand") && modalSrc.includes("wakeWordEnabled"), "JarvisBattleStationModal must support wake-word gating");
  assert.ok(modalSrc.includes("t2_jarvis_ui_state_v1") && modalSrc.includes("t2JarvisGuard"), "JarvisBattleStationModal must persist PWA UI state and guard back-button navigation");
  assert.ok(modalSrc.includes("trimmedCmd.length <= 28"), "Bare publish shortcut must not intercept creative topic post requests");
  assert.ok(modalSrc.includes("bg-[#01030b]/42"), "JarvisBattleStationModal must let SpaceCanvas cosmic stars/planets shine through");

  const postCardSrc = fs.readFileSync(path.join(process.cwd(), "components", "jarvis", "JarvisContentPostCard.tsx"), "utf8");
  assert.ok(postCardSrc.includes("activePost?.brandName || currentSelectedBrand?.name") && postCardSrc.includes("إغلاق بطاقة المنشور"), "JarvisContentPostCard must bind to post brandName and include close button");

  const growthSrc = fs.readFileSync(path.join(process.cwd(), "services", "growthAgencyEngine.ts"), "utf8");
  assert.equal(growthSrc.includes("25% عربون جدية"), false, "growthAgencyEngine must not inject hardcoded 25% عربون boilerplate");
  assert.equal(growthSrc.includes("01030956097"), false, "growthAgencyEngine must not use hardcoded wrong phone");

  const studioRemote = fs.readFileSync(path.join("D:\\t2-studio", "src", "server", "remoteControlApi.ts"), "utf8");
  assert.equal(studioRemote.includes("gemini-3.5-flash-lite"), false, "Studio content.generate_design must not use invalid gemini-3.5-flash-lite");
  assert.equal(studioRemote.includes("gemini-3.1-flash-lite-image"), false, "Studio content.generate_design must not use invalid gemini-3.1-flash-lite-image");
  assert.ok(studioRemote.includes("gemini-2.5-flash-image"), "Studio content.generate_design must use valid Gemini image model with key rotation");
});

test("44) Frictionless 7-day trial (no Google gate), smart brand naming + dropshipping seeding, verified ERP catalog sync & rich store.t2os.app root showcase", () => {
  const routesSrc = fs.readFileSync(path.join(process.cwd(), "components", "AppRoutes.tsx"), "utf8");
  assert.equal(routesSrc.includes("shadowDB.loginWithGoogle()"), false, "Pricing onTrialStart must not force Google OAuth");
  assert.ok(routesSrc.includes("/?persona=visitor&startTrial=1"), "onTrialStart must route straight to Jarvis trial");

  const brainSrc = fs.readFileSync(path.join(process.cwd(), "services", "jarvisBrainEngine.ts"), "utf8");
  assert.ok(
    brainSrc.includes("isRawPromptSentenceNotBrandName") &&
      brainSrc.includes("enableDropshipping: isDropshippingReq") &&
      brainSrc.includes("verifiedProductsCount"),
    "jarvisBrainEngine must prevent raw prompt sentence brand names, enable dropshipping, and verify saved ERP products"
  );

  const vaultSrc = fs.readFileSync(path.join(process.cwd(), "services", "obsidianVaultService.ts"), "utf8");
  assert.ok(
    vaultSrc.includes("verifiedInStore") && vaultSrc.includes("https://store.t2os.app/s/"),
    "UPDATE_STORE_CATALOG must write and read-verify against live tenant ERP store DB"
  );

  const hydSrc = fs.readFileSync(path.join(process.cwd(), "services", "industryHydrationService.ts"), "utf8");
  assert.ok(hydSrc.includes("حامل موبايل مغناطيسي MagSafe"), "industryHydrationService must provide smart gadgets/dropshipping catalog");

  const battahApp = fs.readFileSync("C:\\Users\\ahmed\\.gemini\\antigravity\\brain\\036fb332-c89d-4066-97a1-2cb5a627f42b\\scratch\\battah-repo\\App.tsx", "utf8");
  assert.ok(battahApp.includes("PlatformShowcaseDirectory"), "Root store.t2os.app/ must render PlatformShowcaseDirectory instead of empty storefront");
});





