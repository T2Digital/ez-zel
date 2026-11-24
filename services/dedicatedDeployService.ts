import { getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from './obsidianVaultService';
import { upsertBrandRegistryEntry } from './brandRegistryService';
import { getNextHealthyGeminiKey } from './geminiKeyPool';
import { FlagshipTemplateId, resolveFlagshipTemplate } from './tenantFactory';

export interface DedicatedDeployResult {
  ok: boolean;
  status: 'deployed' | 'missing_credentials' | 'failed';
  brandId: string;
  repoName?: string;
  dedicatedRepoUrl?: string;
  dedicatedLiveUrl?: string;
  vercelPreviewUrl?: string;
  vercelDeploymentId?: string;
  vercelDeployError?: string;
  welcomeKit?: {
    storeUrl: string;
    studioShowroomUrl: string;
    agentQrUrl: string;
    clientPortalUrl: string;
    adminEmail: string;
    adminPin: string;
  };
  missingEnv?: string[];
  message: string;
}

async function enrichCatalogWithGeneratedVisuals(
  catalog: any[],
  opts: { brandName: string; businessType: string; primaryColor: string }
): Promise<any[]> {
  if (!Array.isArray(catalog) || catalog.length === 0) return [];
  const studioKey = String(process.env.T2_REMOTE_API_KEY || process.env.TITO_STUDIO_API_KEY || '').trim();
  if (!studioKey) return catalog;

  const { getTitoStudioBaseUrl } = await import('./titoStudioApiClient');
  const studioBase = getTitoStudioBaseUrl().replace(/\/+$/, '');
  const cloned = catalog.map((item) => ({ ...item }));
  const missingIndices = cloned
    .map((item, idx) => ({ item, idx }))
    .filter(({ item }) => !item?.imageUrl && !(Array.isArray(item?.images) && item.images.length > 0))
    .slice(0, 6);

  for (let i = 0; i < missingIndices.length; i += 2) {
    const batch = missingIndices.slice(i, i + 2);
    await Promise.allSettled(
      batch.map(async ({ item, idx }) => {
        const prompt = `Studio commercial e-commerce product photography for "${item.name || 'منتج مميز'}" (${opts.businessType || 'تجارة إلكترونية'}), brand "${opts.brandName}", clean studio background, soft natural shadows, high resolution, zero text.`;
        const res = await fetch(`${studioBase}/api/studio/generate-product-visual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': studioKey },
          body: JSON.stringify({
            brandName: opts.brandName,
            primaryColor: opts.primaryColor,
            type: 'product',
            prompt,
          }),
          signal: AbortSignal.timeout(25000),
        });
        const data: any = await res.json().catch(() => null);
        if (res.ok && data?.success && data?.url) {
          cloned[idx].imageUrl = data.url;
          cloned[idx].images = [data.url];
        }
      })
    );
  }
  return cloned;
}

const TEMPLATE_REPO_MAP: Record<FlagshipTemplateId, string> = {
  battah: process.env.GITHUB_TEMPLATE_BATTAH || 'battah',
  clean_master: process.env.GITHUB_TEMPLATE_CLEAN_MASTER || 'clean-master-egy',
  harb_restaurant: process.env.GITHUB_TEMPLATE_HARB || 'harb-restaurant-template',
  sehraya_cafe: process.env.GITHUB_TEMPLATE_SEHRAYA || 'sehraya-cafe-template',
  master_key_car_rental: process.env.GITHUB_TEMPLATE_CAR_RENTAL || 'master-key-car-rental-template',
  nile_real_estate: process.env.GITHUB_TEMPLATE_REAL_ESTATE || 'nile-real-estate-template',
};

/**
 * Provisions an independent GitHub repository and Vercel deployment
 * for paid subscribers using T2 Digital's platform GITHUB_TOKEN and VERCEL_TOKEN.
 */
export async function provisionDedicatedRepoAndVercel(input: {
  brandId: string;
  englishSlug?: string;
  brandName?: string;
  businessType?: string;
  phone?: string;
  primaryColor?: string;
  productsCatalog?: any[];
  appTemplate?: 'products_erp' | 'services_booking' | FlagshipTemplateId | string;
  templateId?: FlagshipTemplateId;
}): Promise<DedicatedDeployResult> {
  const brands = getUnifiedGrowthBrands();
  const needle = String(input.brandId || '').trim().toLowerCase();
  let brand: any = brands.find((b: any) =>
    String(b.id || '').toLowerCase() === needle ||
    String(b.slug || '').toLowerCase() === needle ||
    (input.brandName && String(b.name || '').trim().toLowerCase() === String(input.brandName).trim().toLowerCase())
  );
  if (!brand) {
    try {
      const { titoStudioApi } = await import('./titoStudioApiClient');
      const liveRes: any = await titoStudioApi.listBrands();
      const liveList = Array.isArray(liveRes?.brands) ? liveRes.brands : Array.isArray(liveRes) ? liveRes : [];
      const sb = liveList.find((x: any) => {
        const enSlug = String(x.englishName || '').toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
        return String(x.id || '').toLowerCase() === needle ||
          String(x.slug || '').toLowerCase() === needle ||
          enSlug === needle;
      });
      if (sb) {
        brand = {
          id: sb.id,
          slug: sb.slug || String(sb.englishName || sb.id).toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'),
          name: sb.name || sb.englishName,
          englishName: sb.englishName,
          businessType: input.businessType || sb.industry || 'تجارة وخدمات',
          phone: input.phone || sb.phone || '',
          appTemplate: input.appTemplate || 'products_erp',
        };
      }
    } catch {}
  }
  if (!brand && input.brandName) {
    const fallbackSlug = String(input.englishSlug || input.brandId || `brand-${Date.now().toString(36)}`)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '') || `brand-${Date.now().toString(36)}`;
    brand = {
      id: fallbackSlug.replace(/-/g, '_'),
      slug: fallbackSlug,
      name: input.brandName,
      englishName: input.englishSlug || fallbackSlug,
      businessType: input.businessType || 'تجارة إلكترونية',
      phone: input.phone || '',
      appTemplate: input.appTemplate || 'products_erp',
    };
  }
  if (!brand) {
    return {
      ok: false,
      status: 'failed',
      brandId: input.brandId,
      message: `البراند (${input.brandId}) غير موجود في السجل.`
    };
  }

  const githubToken = process.env.GITHUB_TOKEN || '';
  const vercelToken = process.env.VERCEL_TOKEN || '';
  const missingEnv: string[] = [];
  if (!githubToken) missingEnv.push('GITHUB_TOKEN');
  if (!vercelToken) missingEnv.push('VERCEL_TOKEN');

  if (missingEnv.length > 0) {
    return {
      ok: false,
      status: 'missing_credentials',
      brandId: brand.id,
      missingEnv,
      message: `لتفعيل النشر التلقائي لمستودع مستقل على GitHub + Vercel، يرجى إضافة المتغيرات (${missingEnv.join(', ')}) في Coolify.`
    };
  }

  const rawAsciiSource = String(
    input.englishSlug ||
      (brand as any).englishSlug ||
      (brand as any).englishName ||
      brand.slug ||
      brand.id ||
      ''
  );
  const slug =
    rawAsciiSource
      .toLowerCase()
      .replace(/&/g, '-and-')
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || `t2-client-${Date.now().toString(36)}`;
  const repoName = `t2-tenant-${slug}`;
  const requestedTemplate = (input.templateId || (brand as any).templateId) as FlagshipTemplateId | undefined;
  let resolvedKey: FlagshipTemplateId;
  if (requestedTemplate && TEMPLATE_REPO_MAP[requestedTemplate]) {
    resolvedKey = requestedTemplate;
  } else {
    const inferred = resolveFlagshipTemplate(`${input.appTemplate || ''} ${brand.businessType || ''} ${brand.name || ''}`).templateKey;
    if (inferred === 'clean_master' && (input.appTemplate || (brand as any).appTemplate) === 'products_erp') {
      resolvedKey = 'battah';
    } else {
      resolvedKey = inferred;
    }
  }
  const templateRepo = TEMPLATE_REPO_MAP[resolvedKey] || TEMPLATE_REPO_MAP.clean_master;
  const templateOwner = process.env.GITHUB_TEMPLATE_OWNER || 'T2Digital';

  try {
    // 1. Check authenticated GitHub owner
    const userRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }
    });
    const userData: any = await userRes.json();
    const owner = userData?.login || templateOwner;

    // 2. Try generating from template repo first, fallback to creating an empty repo
    let repoUrl = `https://github.com/${owner}/${repoName}`;
    const genRes = await fetch(`https://api.github.com/repos/${templateOwner}/${templateRepo}/generate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        owner,
        name: repoName,
        description: `Dedicated T2 Digital Flagship App for ${brand.name}`,
        private: false,
        include_all_branches: false
      })
    });

    if (!genRes.ok) {
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          description: `Dedicated T2 Digital App for ${brand.name}`,
          private: false,
          auto_init: true
        })
      });
      if (createRes.ok) {
        const created: any = await createRes.json();
        repoUrl = created.html_url || repoUrl;
      }
    } else {
      const generated: any = await genRes.json();
      repoUrl = generated.html_url || repoUrl;
    }

    const asciiSlug = String(brand.slug || slug).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || slug;
    const phoneDigits = String(brand.phone || '').replace(/\D/g, '');
    const adminPin = String((brand as any).adminPin || phoneDigits.slice(-6) || '373634');
    const adminEmail = String((brand as any).adminEmail || `owner@${asciiSlug}.t2.app`).toLowerCase();
    const resolvedPrimaryColor = input.primaryColor || (brand as any).primaryColor || '#06b6d4';
    const rawCatalog =
      Array.isArray(input.productsCatalog) && input.productsCatalog.length > 0
        ? input.productsCatalog
        : Array.isArray((brand as any).productsCatalog)
          ? (brand as any).productsCatalog
          : [];
    const resolvedCatalog = await enrichCatalogWithGeneratedVisuals(rawCatalog, {
      brandName: input.brandName || brand.name || asciiSlug,
      businessType: input.businessType || brand.businessType || 'تجارة إلكترونية',
      primaryColor: resolvedPrimaryColor,
    });

    // 2b. Poll until GitHub finishes asynchronous template generation (index.html exists)
    let idxData: any = null;
    for (let waitTry = 0; waitTry < 12; waitTry++) {
      try {
        const probeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
          headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }
        });
        if (probeRes.ok) {
          idxData = await probeRes.json();
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }

    // 3. Inject brand tenant-config.json into the dedicated repo (idempotent: include sha if already present)
    const configContent = Buffer.from(
      JSON.stringify(
        {
          id: brand.id,
          brandId: brand.id,
          slug: asciiSlug,
          name: input.brandName || brand.name,
          slogan: (brand as any).slogan || input.businessType || brand.businessType || '',
          logoUrl: (brand as any).logoUrl || '',
          phone: input.phone || brand.phone || '',
          whatsapp: (brand as any).whatsapp || input.phone || brand.phone || '',
          adminEmail,
          adminPin,
          primaryColor: resolvedPrimaryColor,
          accentColor: (brand as any).accentColor || '#0f172a',
          commercialRegister: (brand as any).commercialRegister || '',
          taxCardNumber: (brand as any).taxCardNumber || '',
          enableCash: typeof (brand as any).enableCash === 'boolean' ? (brand as any).enableCash : true,
          shippingCost: (brand as any).shippingCost,
          governorates: Array.isArray((brand as any).governorates) ? (brand as any).governorates : undefined,
          productsCatalog: resolvedCatalog,
          templateId: resolvedKey,
          appTemplate: input.appTemplate || (brand as any).appTemplate || 'services_booking',
          ezZelApiBase: process.env.PUBLIC_BASE_URL || 'https://t2os.app'
        },
        null,
        2
      )
    ).toString('base64');

    let existingCfgSha: string | undefined;
    try {
      const cfgProbe = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/public/tenant-config.json`, {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }
      });
      if (cfgProbe.ok) {
        const cfgJson: any = await cfgProbe.json();
        if (cfgJson?.sha) existingCfgSha = cfgJson.sha;
      }
    } catch {}

    await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/public/tenant-config.json`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore(tenant): configure dedicated brand ${input.brandName || brand.name}`,
        content: configContent,
        ...(existingCfgSha ? { sha: existingCfgSha } : {})
      })
    }).catch(() => {});

    // 3b. Rebrand index.html title/meta/logo in cloned repo so SSR/initial load matches the new brand
    try {
      if (!idxData) {
        const idxRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
          headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }
        });
        if (idxRes.ok) idxData = await idxRes.json();
      }
      if (idxData?.content) {
        const rawHtml = Buffer.from(idxData.content || '', 'base64').toString('utf8');
        const safeName = String(input.brandName || brand.name || brand.slug).replace(/[<>]/g, '');
        const safeSlogan = String((brand as any).slogan || input.businessType || brand.businessType || `متجر ونظام إدارة ${safeName}`).replace(/[<>]/g, '');
        const safeLogo = String((brand as any).logoUrl || '').trim();
        let rebrandedHtml = rawHtml
          .replace(/بطاح الأصلي|كلين ماستر|مطعم حرب|كافيه سهرايا|ماستر كي لتأجير السيارات|النيل للاستثمار العقاري|بطاح/g, safeName)
          .replace(/قطع غيار سيارات أصلية/g, safeSlogan)
          .replace(/تسوق أفضل قطع غيار السيارات الأصلية والإكسسوارات من [^."<]+/g, safeSlogan);
        if (safeLogo) {
          rebrandedHtml = rebrandedHtml.replace(/https:\/\/i\.ibb\.co\/LDdGwd87\/5-1\.png/g, safeLogo);
        }
        const putIdx = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/index.html`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: `chore(tenant): rebrand index.html for ${safeName}`,
            content: Buffer.from(rebrandedHtml, 'utf8').toString('base64'),
            sha: idxData.sha
          })
        });
        if (!putIdx.ok) {
          console.warn('[DedicatedDeploy] index.html PUT status:', putIdx.status);
        }
      }
    } catch {}

    // 4. Create Vercel project & deployment
    const vercelProjRes = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: repoName,
        framework: 'vite',
        gitRepository: {
          type: 'github',
          repo: `${owner}/${repoName}`
        }
      })
    });

    let dedicatedLiveUrl = `https://${repoName}.vercel.app`;
    let vercelProjectId = '';
    if (vercelProjRes.ok) {
      const projData: any = await vercelProjRes.json();
      if (projData?.name) {
        dedicatedLiveUrl = `https://${projData.name}.vercel.app`;
      }
      vercelProjectId = projData?.id || repoName;
    }

    // 5. Auto-inject required Environment Variables into the dedicated Vercel project
    // SECURITY HARDENING: NEVER inject VITE_GEMINI_API_KEY or any secret with VITE_ prefix
    // into client browser bundles. All AI calls must use server-side GEMINI_API_KEY or VITE_EZZEL_API_URL proxy.
    const envTarget = vercelProjectId || repoName;
    const rotatingGeminiKey = getNextHealthyGeminiKey();
    const envVarsToInject: Array<{ key: string; value: string }> = [
      { key: 'VITE_EZZEL_API_URL', value: process.env.PUBLIC_BASE_URL || 'https://t2os.app' },
      { key: 'VITE_TENANT_BRAND_ID', value: String(brand.slug || brand.id) },
      { key: 'TENANT_ADMIN_PASSWORD', value: `T2@${adminPin}` },
      ...(rotatingGeminiKey
        ? [
            { key: 'GEMINI_API_KEY', value: rotatingGeminiKey }
          ]
        : [])
    ].filter((ev) => !/^VITE_.*(KEY|SECRET|TOKEN|PASSWORD)/i.test(ev.key));

    for (const ev of envVarsToInject) {
      await fetch(`https://api.vercel.com/v10/projects/${encodeURIComponent(envTarget)}/env?upsert=true`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key: ev.key,
          value: ev.value,
          type: 'encrypted',
          target: ['production', 'preview', 'development']
        })
      }).catch(() => {});
    }

    // 6. Trigger initial production deployment on Vercel (wait briefly after git commits, pass numeric repoId)
    let vercelDeploymentId = '';
    let vercelDeployError = '';
    let vercelPreviewUrl: string | undefined;
    try {
      await new Promise((r) => setTimeout(r, 1500));
      const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
        headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' }
      });
      const repoInfo: any = repoInfoRes.ok ? await repoInfoRes.json() : {};
      const repoId = repoInfo?.id;
      const depRes = await fetch('https://api.vercel.com/v13/deployments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: repoName,
          project: envTarget,
          target: 'production',
          gitSource: {
            type: 'github',
            org: owner,
            repo: repoName,
            ref: 'main',
            ...(repoId ? { repoId } : {})
          }
        })
      });
      const depJson: any = await depRes.json().catch(() => ({}));
      if (depRes.ok) {
        vercelDeploymentId = depJson?.id || depJson?.uid || '';
        if (depJson?.url) vercelPreviewUrl = `https://${depJson.url}`;
      } else {
        vercelDeployError = depJson?.error?.message || `HTTP ${depRes.status}`;
      }
    } catch (depErr: any) {
      vercelDeployError = depErr?.message || 'Vercel deploy call failed';
    }

    persistBrandUpdateAcrossEcosystem(brand.id, {
      dedicatedRepoUrl: repoUrl,
      dedicatedLiveUrl,
      appUrl: dedicatedLiveUrl,
      productsCatalog: resolvedCatalog,
      adminEmail,
      adminPin
    } as any);
    upsertBrandRegistryEntry(brand.id, {
      slug: brand.slug || brand.id,
      name: input.brandName || brand.name,
      dedicatedRepoUrl: repoUrl,
      dedicatedLiveUrl,
      appUrl: dedicatedLiveUrl
    });

    // Live non-disruptive catalog & price sync to T2 Agent
    try {
      const { getT2AgentBaseUrl } = await import('./t2AgentApiClient');
      const agentBase = getT2AgentBaseUrl().replace(/\/+$/, '');
      const agentBrandId = String((brand as any).agentBrandId || brand.slug || brand.id)
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      const agentAdminKey = String(process.env.T2_AGENT_ADMIN_KEY || process.env.ADMIN_SECRET_KEY || '').trim();
      const syncHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      if (agentAdminKey) syncHeaders['x-admin-key'] = agentAdminKey;
      fetch(`${agentBase}/api/brands/${encodeURIComponent(agentBrandId)}/sync-catalog`, {
        method: 'POST',
        headers: syncHeaders,
        body: JSON.stringify({
          name: input.brandName || brand.name,
          businessType: input.businessType || brand.businessType,
          websiteUrl: dedicatedLiveUrl,
          productsCatalog: resolvedCatalog,
        }),
        signal: AbortSignal.timeout(8000),
      }).catch(() => {});
    } catch {}

    const studioClinicId = String((brand as any).titoStudioClinicId || brand.id);
    const agentSlotId = String((brand as any).agentBrandId || brand.slug || brand.id)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
    const ezBaseUrl = String(process.env.PUBLIC_BASE_URL || 'https://t2os.app').replace(/\/+$/, '');
    const welcomeKit = {
      storeUrl: dedicatedLiveUrl,
      studioShowroomUrl: `https://studio.t2os.app/?view=clientPortal&brandId=${encodeURIComponent(studioClinicId)}`,
      agentQrUrl: `https://agent.t2os.app/dashboard?brandId=${encodeURIComponent(agentSlotId)}`,
      clientPortalUrl: `${ezBaseUrl}/portal/${encodeURIComponent(brand.slug || brand.id)}`,
      adminEmail,
      adminPin,
    };

    // Zero-Touch Onboarding notification (WhatsApp + Telegram)
    try {
      const { sendZeroTouchOnboardingPacket } = await import('./tenantErpStoreService');
      await sendZeroTouchOnboardingPacket({
        brandId: brand.id,
        slug: asciiSlug,
        brandName: brand.name,
        phone: brand.phone || '',
        liveAppUrl: dedicatedLiveUrl,
        adminEmail,
        tempPassword: `T2@${adminPin}`
      });
    } catch {}

    return {
      ok: true,
      status: 'deployed',
      brandId: brand.id,
      repoName,
      dedicatedRepoUrl: repoUrl,
      dedicatedLiveUrl,
      welcomeKit,
      ...(vercelPreviewUrl ? { vercelPreviewUrl } : {}),
      ...(vercelDeploymentId ? { vercelDeploymentId } : {}),
      ...(vercelDeployError ? { vercelDeployError } : {}),
      message: `تم إنشاء مستودع مستقل (${repoUrl}) وربطه على Vercel (${dedicatedLiveUrl}) بنجاح للعميل المدفوع!`
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 'failed',
      brandId: brand.id,
      message: `تعذر إكمال النشر المستقل عبر GitHub/Vercel: ${err?.message || 'Unknown error'}`
    };
  }
}
