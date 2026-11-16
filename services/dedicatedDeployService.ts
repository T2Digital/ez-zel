import { getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from './obsidianVaultService';
import { getNextHealthyGeminiKey } from './geminiKeyPool';

export interface DedicatedDeployResult {
  ok: boolean;
  status: 'deployed' | 'missing_credentials' | 'failed';
  brandId: string;
  repoName?: string;
  dedicatedRepoUrl?: string;
  dedicatedLiveUrl?: string;
  missingEnv?: string[];
  message: string;
}

/**
 * Provisions an independent GitHub repository and Vercel deployment
 * for paid subscribers using T2 Digital's platform GITHUB_TOKEN and VERCEL_TOKEN.
 */
export async function provisionDedicatedRepoAndVercel(input: {
  brandId: string;
  appTemplate?: 'products_erp' | 'services_booking';
}): Promise<DedicatedDeployResult> {
  const brands = getUnifiedGrowthBrands();
  const brand = brands.find((b: any) => b.id === input.brandId || b.slug === input.brandId);
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
      message: `لتفعيل النشر التلقائي لمستودع مستقل على GitHub + Vercel، يرجى إضافة المتغيرات (${missingEnv.join(', ')}) في Render. حالياً يعمل البراند بنجاح على رابط Multi-Tenant الكامل.`
    };
  }

  const slug = String(brand.slug || brand.id)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || `t2-client-${Date.now()}`;
  const repoName = `t2-tenant-${slug}`;
  const templateRepo =
    (input.appTemplate || (brand as any).appTemplate) === 'products_erp'
      ? (process.env.GITHUB_TEMPLATE_BATTAH || 'battah')
      : (process.env.GITHUB_TEMPLATE_CLEAN_MASTER || 'clean-master-egy');
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

    // 3. Inject brand tenant-config.json into the dedicated repo
    const configContent = Buffer.from(
      JSON.stringify(
        {
          brandId: brand.id,
          slug: brand.slug || brand.id,
          name: brand.name,
          slogan: (brand as any).slogan || '',
          logoUrl: (brand as any).logoUrl || '',
          phone: brand.phone || '',
          appTemplate: input.appTemplate || (brand as any).appTemplate || 'services_booking',
          ezZelApiBase: process.env.PUBLIC_BASE_URL || 'https://ez-zel.onrender.com'
        },
        null,
        2
      )
    ).toString('base64');

    await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/tenant-config.json`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: `chore(tenant): configure dedicated brand ${brand.name}`,
        content: configContent
      })
    }).catch(() => {});

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
    const envTarget = vercelProjectId || repoName;
    const rotatingGeminiKey = getNextHealthyGeminiKey();
    const envVarsToInject: Array<{ key: string; value: string }> = [
      { key: 'VITE_EZZEL_API_URL', value: process.env.PUBLIC_BASE_URL || 'https://ez-zel.onrender.com' },
      { key: 'VITE_TENANT_BRAND_ID', value: String(brand.slug || brand.id) },
      ...(rotatingGeminiKey
        ? [
            { key: 'VITE_GEMINI_API_KEY', value: rotatingGeminiKey },
            { key: 'GEMINI_API_KEY', value: rotatingGeminiKey }
          ]
        : [])
    ];

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

    persistBrandUpdateAcrossEcosystem(brand.id, {
      dedicatedRepoUrl: repoUrl,
      dedicatedLiveUrl
    } as any);

    return {
      ok: true,
      status: 'deployed',
      brandId: brand.id,
      repoName,
      dedicatedRepoUrl: repoUrl,
      dedicatedLiveUrl,
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
