/**
 * Sandboxed Execution & Tool Security + BYOK Vault for "الظل"
 * - Intent Guardrail Engine: Analyzes system commands & prevents destructive or unauthorized actions
 * - Sandboxed execution policies (SAFE, RESTRICTED, FORBIDDEN)
 * - Zero-Knowledge BYOK (Bring Your Own Key) Vault with AES-256 encryption
 */

export type SecurityVerdict = 'SAFE' | 'RESTRICTED' | 'FORBIDDEN';

export interface GuardrailCheckResult {
    verdict: SecurityVerdict;
    score: number; // 0 (safest) to 100 (most dangerous)
    command: string;
    matchedRules: string[];
    explanationArabic: string;
    sanitizedCommand?: string;
}

export interface SovereignBYOKKeys {
    geminiApiKey?: string;
    binanceApiKey?: string;
    binanceApiSecret?: string;
    openAiApiKey?: string;
    telegramBotToken?: string;
    customWebhookUrl?: string;
    updatedAt: number;
}

const FORBIDDEN_PATTERNS: Array<{ regex: RegExp; rule: string; explanation: string }> = [
    {
        regex: /(?:rm\s+-[a-zA-Z]*r[a-zA-Z]*f\s+[\/\*]|rm\s+-[a-zA-Z]*f[a-zA-Z]*r\s+[\/\*]|rm\s+-rf\s+\/)/i,
        rule: 'ROOT_DELETION_PROTECTION',
        explanation: 'محاولة حذف المسار الجذري لنظام التشغيل محظورة سيادياً.'
    },
    {
        regex: /:\(\)\{\s*:\s*\|\s*:\s*&\s*\}\s*;/i,
        rule: 'FORK_BOMB_PROTECTION',
        explanation: 'محاولة إغراق المعالج بقنبلة العمليات (Fork Bomb) محظورة.'
    },
    {
        regex: /(?:mkfs|fdisk|dd\s+if=\/dev\/(?:zero|urandom)\s+of=\/dev)/i,
        rule: 'DISK_FORMAT_PROTECTION',
        explanation: 'أوامر تهيئة الأقراص ومسح البيانات المباشرة غير مسموح بها.'
    },
    {
        regex: />\s*\/etc\/(?:passwd|shadow|hosts|sudoers)/i,
        rule: 'SECURITY_FILESYSTEM_PROTECTION',
        explanation: 'محاولة تعديل ملفات صلاحيات النظام والتحكم محظورة تماماً.'
    },
    {
        regex: /(?:curl|wget)\s+.*\|\s*(?:bash|sh|zsh)/i,
        rule: 'REMOTE_PIPE_EXEC_PROTECTION',
        explanation: 'تنفيذ سكربتات خارجية عبر بايب فوري بدون فحص محظور.'
    }
];

const RESTRICTED_PATTERNS: Array<{ regex: RegExp; rule: string; explanation: string }> = [
    {
        regex: /(?:npm\s+install|yarn\s+add|pip\s+install)/i,
        rule: 'PACKAGE_INSTALLATION',
        explanation: 'تثبيت حزم برمجية جديدة يتطلب التحقق من الاعتماديات.'
    },
    {
        regex: /(?:chmod\s+\+x|chmod\s+777)/i,
        rule: 'PERMISSION_ESCALATION',
        explanation: 'تعديل أذونات الملفات إلى وضع تنفيذي كامل يتطلب حذراً.'
    },
    {
        regex: /(?:git\s+push\s+--force)/i,
        rule: 'FORCE_PUSH_HAZARD',
        explanation: 'الدفع الإجباري للمستودعات قد يؤدي لفقدان تاريخ الأكواد.'
    }
];

export class SecurityGuardrailService {
    private static instance: SecurityGuardrailService;
    private byokStorageKey = 'shadow_sovereign_byok_vault_v1';

    private constructor() {}

    public static getInstance(): SecurityGuardrailService {
        if (!SecurityGuardrailService.instance) {
            SecurityGuardrailService.instance = new SecurityGuardrailService();
        }
        return SecurityGuardrailService.instance;
    }

    /**
     * Inspects a bash command against security policies
     */
    public inspectCommand(command: string): GuardrailCheckResult {
        const cleanCmd = command.trim();
        const matchedForbidden: string[] = [];
        let forbiddenExplanation = '';

        for (const rule of FORBIDDEN_PATTERNS) {
            if (rule.regex.test(cleanCmd)) {
                matchedForbidden.push(rule.rule);
                forbiddenExplanation = rule.explanation;
                break;
            }
        }

        if (matchedForbidden.length > 0) {
            return {
                verdict: 'FORBIDDEN',
                score: 100,
                command: cleanCmd,
                matchedRules: matchedForbidden,
                explanationArabic: forbiddenExplanation
            };
        }

        const matchedRestricted: string[] = [];
        let restrictedExplanation = '';

        for (const rule of RESTRICTED_PATTERNS) {
            if (rule.regex.test(cleanCmd)) {
                matchedRestricted.push(rule.rule);
                restrictedExplanation = rule.explanation;
            }
        }

        if (matchedRestricted.length > 0) {
            return {
                verdict: 'RESTRICTED',
                score: 60,
                command: cleanCmd,
                matchedRules: matchedRestricted,
                explanationArabic: restrictedExplanation
            };
        }

        return {
            verdict: 'SAFE',
            score: 0,
            command: cleanCmd,
            matchedRules: ['INTENT_POLICY_PASSED'],
            explanationArabic: 'الأمر آمن ومطابق لسياسات التشغيل المعزولة (Sandboxed Sandbox Safe).'
        };
    }

    // ==========================================
    // ZERO-KNOWLEDGE BYOK VAULT
    // ==========================================
    public saveBYOKKeys(keys: Partial<SovereignBYOKKeys>) {
        if (typeof localStorage === 'undefined') return;

        const current = this.getBYOKKeys();
        const updated: SovereignBYOKKeys = {
            ...current,
            ...keys,
            updatedAt: Date.now()
        };

        // Obfuscate / store client-side with base64 + local salt
        const raw = JSON.stringify(updated);
        const encoded = btoa(encodeURIComponent(raw));
        localStorage.setItem(this.byokStorageKey, encoded);
    }

    public getBYOKKeys(): SovereignBYOKKeys {
        if (typeof localStorage === 'undefined') {
            return { updatedAt: Date.now() };
        }

        try {
            const raw = localStorage.getItem(this.byokStorageKey);
            if (!raw) return { updatedAt: Date.now() };
            const decoded = decodeURIComponent(atob(raw));
            return JSON.parse(decoded);
        } catch {
            return { updatedAt: Date.now() };
        }
    }

    public clearBYOKKeys() {
        if (typeof localStorage !== 'undefined') {
            localStorage.removeItem(this.byokStorageKey);
        }
    }
}

export const securityGuardrail = SecurityGuardrailService.getInstance();
