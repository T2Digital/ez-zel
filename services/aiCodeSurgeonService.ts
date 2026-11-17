import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { loadTenantErpState, saveTenantErpState, normalizeSlugKey } from './tenantErpStoreService';

const HISTORY_PATH = path.join(process.cwd(), 'data', 'code_surgeon_history.json');

interface CodeBackupEntry {
  id: string;
  owner: string;
  repo: string;
  filePath: string;
  previousContent: string;
  previousSha: string;
  commitMessage: string;
  createdAt: string;
}

function readHistory(): CodeBackupEntry[] {
  try {
    if (fs.existsSync(HISTORY_PATH)) {
      return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8'));
    }
  } catch {}
  return [];
}

function saveHistory(entries: CodeBackupEntry[]) {
  try {
    const dir = path.dirname(HISTORY_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(entries.slice(0, 30), null, 2), 'utf8');
  } catch {}
}

export async function customizeAppLiveConfig(
  slug: string,
  options: {
    activeBranches?: Array<{ key: string; label: string }>;
    cashiers?: Array<{ value: string; label: string }>;
    branchCount?: number;
    cashierCount?: number;
    primaryBranchLabel?: string;
    primaryCashierLabel?: string;
  }
) {
  const slugKey = normalizeSlugKey(slug);
  const current = await loadTenantErpState(slugKey);
  const currentCustom = (current.appCustomization && typeof current.appCustomization === 'object') ? { ...current.appCustomization } : {};

  let nextBranches = options.activeBranches;
  if (!nextBranches && typeof options.branchCount === 'number') {
    const allDefaults = [
      { key: 'branch1', label: options.primaryBranchLabel || 'الفرع الرئيسي' },
      { key: 'branch2', label: 'فرع 1' },
      { key: 'branch3', label: 'فرع 2' },
      { key: 'main', label: 'المخزن الرئيسي' }
    ];
    nextBranches = allDefaults.slice(0, Math.max(1, Math.min(4, options.branchCount)));
  }

  let nextCashiers = options.cashiers;
  if (!nextCashiers && typeof options.cashierCount === 'number') {
    const allCashiers = [
      { value: 'تحت', label: options.primaryCashierLabel || 'الكاشير الرئيسي' },
      { value: 'فوق', label: 'كاشير فوق' },
      { value: 'online', label: 'كاشير أونلاين' }
    ];
    nextCashiers = allCashiers.slice(0, Math.max(1, Math.min(3, options.cashierCount)));
  }

  const nextCustom = {
    ...currentCustom,
    ...(nextBranches ? { activeBranches: nextBranches } : {}),
    ...(nextCashiers ? { cashiers: nextCashiers } : {}),
    updatedAt: new Date().toISOString()
  };

  await saveTenantErpState(slugKey, { appCustomization: nextCustom });
  return {
    ok: true,
    slug: slugKey,
    appCustomization: nextCustom,
    message: `تم تحديث إعدادات واجهة التطبيق (${slugKey}) لحظياً: ${nextBranches ? `${nextBranches.length} فروع` : ''} ${nextCashiers ? `• ${nextCashiers.length} كاشير` : ''}`.trim()
  };
}

export async function inspectTenantRepo(repoName: string, filePath?: string) {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token) return { ok: false, error: 'GITHUB_TOKEN غير مضبوط على السيرفر' };
  const owner = process.env.GITHUB_TEMPLATE_OWNER || 'T2Digital';
  const headers = { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' };

  if (filePath) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repoName}/contents/${filePath}`, { headers });
    if (!res.ok) return { ok: false, error: `الملف ${filePath} غير موجود في ${owner}/${repoName}` };
    const data: any = await res.json();
    const content = Buffer.from(data.content || '', 'base64').toString('utf8');
    return { ok: true, owner, repo: repoName, filePath, sha: data.sha, length: content.length, preview: content.slice(0, 3500) };
  }

  const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/git/trees/main?recursive=1`, { headers });
  if (!treeRes.ok) return { ok: false, error: `تعذر قراءة ملفات ${owner}/${repoName}` };
  const tree: any = await treeRes.json();
  const files = (tree.tree || [])
    .filter((t: any) => t.type === 'blob' && /\.(tsx?|jsx?|json|html|css)$/.test(t.path) && !t.path.startsWith('node_modules'))
    .map((t: any) => t.path)
    .slice(0, 120);
  return { ok: true, owner, repo: repoName, files };
}

export async function editTenantRepoCode(input: {
  repoName: string;
  filePath: string;
  instruction: string;
  ai: GoogleGenAI;
}) {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token) return { ok: false, error: 'GITHUB_TOKEN غير مضبوط على السيرفر' };
  const owner = process.env.GITHUB_TEMPLATE_OWNER || 'T2Digital';
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };

  // 1. Fetch original file + SHA
  const fileRes = await fetch(`https://api.github.com/repos/${owner}/${input.filePath ? `${input.repoName}/contents/${input.filePath}` : input.repoName}`, { headers });
  if (!fileRes.ok) {
    return { ok: false, error: `تعذر جلب الملف ${input.filePath} من ${owner}/${input.repoName}` };
  }
  const fileData: any = await fileRes.json();
  const originalContent = Buffer.from(fileData.content || '', 'base64').toString('utf8');
  const previousSha = fileData.sha;

  // 2. Ask Gemini to generate surgical full-file update
  const genResp = await input.ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            text:
              `أنت مهندس TypeScript/React خبير. طبّق التعديل المطلوب بدقة جراحية على الملف التالي مع الحفاظ على كل باقي الكود والواردات (imports) سليمة 100%.\n` +
              `أعد الكود الكامل للملف المعدّل فقط بدون علامات markdown أو شرح إضافي.\n\n` +
              `[التعديل المطلوب]: ${input.instruction}\n` +
              `[اسم الملف]: ${input.filePath}\n\n` +
              `[الكود الأصلي]:\n${originalContent}`
          }
        ]
      }
    ]
  });

  let updatedCode = String(genResp?.text || '').trim();
  updatedCode = updatedCode.replace(/^```[a-zA-Z]*\r?\n/, '').replace(/\r?\n```$/, '').trim();
  if (!updatedCode || updatedCode.length < Math.min(40, originalContent.length * 0.3)) {
    return { ok: false, error: 'فشل الذكاء الاصطناعي في توليد كود صالح' };
  }

  // 3. Mandatory Syntax / AST Verification Gate via esbuild BEFORE committing to GitHub
  const ext = path.extname(input.filePath).toLowerCase();
  if (['.ts', '.tsx', '.js', '.jsx'].includes(ext)) {
    try {
      const esbuild = await import('esbuild');
      const loader = ext === '.tsx' ? 'tsx' : ext === '.jsx' ? 'jsx' : ext === '.ts' ? 'ts' : 'js';
      await esbuild.transform(updatedCode, { loader });
    } catch (syntaxErr: any) {
      return {
        ok: false,
        error: `تم رفض التعديل قبل الرفع لأن فيه خطأ برمجي (Syntax Guard): ${syntaxErr?.message || 'Parse error'}`
      };
    }
  } else if (ext === '.json') {
    try {
      JSON.parse(updatedCode);
    } catch (jsonErr: any) {
      return { ok: false, error: `تم رفض التعديل: JSON غير صالح (${jsonErr?.message})` };
    }
  }

  // 4. Backup original for 1-click Rollback
  const commitMessage = `feat(jarvis-surgeon): ${input.instruction.slice(0, 72)}`;
  const history = readHistory();
  history.unshift({
    id: `surgeon_${Date.now()}`,
    owner,
    repo: input.repoName,
    filePath: input.filePath,
    previousContent: originalContent,
    previousSha,
    commitMessage,
    createdAt: new Date().toISOString()
  });
  saveHistory(history);

  // 5. Commit & Push to GitHub -> triggers Vercel auto-deploy
  const putRes = await fetch(`https://api.github.com/repos/${owner}/${input.repoName}/contents/${input.filePath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: commitMessage,
      content: Buffer.from(updatedCode, 'utf8').toString('base64'),
      sha: previousSha,
      branch: 'main'
    })
  });
  const putData: any = await putRes.json().catch(() => ({}));
  if (!putRes.ok) {
    return { ok: false, error: `فشل رفع التعديل على GitHub: ${putData?.message || putRes.status}` };
  }

  return {
    ok: true,
    repo: `${owner}/${input.repoName}`,
    filePath: input.filePath,
    commitSha: putData?.commit?.sha || '',
    commitUrl: putData?.commit?.html_url || `https://github.com/${owner}/${input.repoName}`,
    message: `تم تعديل ${input.filePath} في ${owner}/${input.repoName} واجتياز فحص الصياغة ورفعه على GitHub؛ بدأ بناء Vercel تلقائياً الآن!`
  };
}

export async function rollbackLastRepoEdit(repoName?: string) {
  const token = process.env.GITHUB_TOKEN || '';
  if (!token) return { ok: false, error: 'GITHUB_TOKEN غير مضبوط على السيرفر' };
  const history = readHistory();
  const entry = repoName ? history.find(h => h.repo === repoName) : history[0];
  if (!entry) return { ok: false, error: 'لا توجد تعديلات سابقة متاحة للاسترجاع' };

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json'
  };
  const curRes = await fetch(`https://api.github.com/repos/${entry.owner}/${entry.repo}/contents/${entry.filePath}`, { headers });
  const curData: any = curRes.ok ? await curRes.json() : {};
  const currentSha = curData?.sha || entry.previousSha;

  const putRes = await fetch(`https://api.github.com/repos/${entry.owner}/${entry.repo}/contents/${entry.filePath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `revert(jarvis-surgeon): rollback ${entry.filePath}`,
      content: Buffer.from(entry.previousContent, 'utf8').toString('base64'),
      sha: currentSha,
      branch: 'main'
    })
  });
  if (!putRes.ok) return { ok: false, error: 'تعذر تنفيذ التراجع على GitHub' };

  return {
    ok: true,
    repo: `${entry.owner}/${entry.repo}`,
    filePath: entry.filePath,
    message: `تم التراجع عن آخر تعديل واستعادة النسخة السابقة من ${entry.filePath} بنجاح!`
  };
}
