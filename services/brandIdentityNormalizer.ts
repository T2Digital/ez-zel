import crypto from "crypto";

/**
 * Canonical Brand Identity Normalizer (D:\ez-zel-\services\brandIdentityNormalizer.ts)
 * Unifies brand lookups across Ez-Zel (`id`/`slug`), T2 Studio (`clinicId`),
 * and T2 Agent (`agentBrandId`), preventing `-` vs `_` mismatches.
 */

export function transliterateArabicToSlug(raw: string, fallback = "brand"): string {
  const map: Record<string, string> = {
    'ا': 'a', 'أ': 'a', 'إ': 'e', 'آ': 'a', 'ى': 'a', 'ء': '', 'ؤ': 'w', 'ئ': 'y',
    'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'g', 'ح': 'h', 'خ': 'kh',
    'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z', 'س': 's', 'ش': 'sh',
    'ص': 's', 'ض': 'd', 'ط': 't', 'ظ': 'z', 'ع': 'a', 'غ': 'gh',
    'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'ه': 'h', 'ة': 'a', 'و': 'w', 'ي': 'y',
    '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
    '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  };
  let out = '';
  for (const ch of String(raw || '').trim()) {
    out += Object.prototype.hasOwnProperty.call(map, ch) ? map[ch] : ch;
  }
  const cleaned = out
    .toLowerCase()
    .replace(/&/g, '-and-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

export function toCanonicalSlug(raw: string, fallback = "default"): string {
  const cleaned = transliterateArabicToSlug(raw, "");
  return cleaned || fallback;
}

export function toCanonicalAgentId(raw: string, fallback = "default"): string {
  const cleaned = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned || fallback;
}

export function toAlnumLookupKey(raw: string): string {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "");
}

export function areBrandIdsEquivalent(a?: string | null, b?: string | null): boolean {
  const sA = String(a || "").trim();
  const sB = String(b || "").trim();
  if (!sA || !sB) return false;
  if (sA.toLowerCase() === sB.toLowerCase()) return true;
  const kA = toAlnumLookupKey(sA);
  const kB = toAlnumLookupKey(sB);
  return Boolean(kA && kB && kA === kB);
}

export function findMatchingBrandRecord<T extends Record<string, any>>(
  list: T[],
  needleRaw: string
): T | undefined {
  if (!Array.isArray(list) || !needleRaw) return undefined;
  const needle = String(needleRaw).trim();
  const needleLower = needle.toLowerCase();
  const needleAlnum = toAlnumLookupKey(needle);

  return list.find((item) => {
    if (!item || typeof item !== "object") return false;
    const candidates: string[] = [
      item.canonicalId,
      item.id,
      item.slug,
      item.englishName,
      item.titoStudioClinicId,
      item.studioBrandId,
      item.agentBrandId,
      ...(Array.isArray(item.mergedFromIds) ? item.mergedFromIds : []),
    ]
      .map((v) => String(v || "").trim())
      .filter(Boolean);

    if (candidates.some((c) => c.toLowerCase() === needleLower)) return true;
    if (needleAlnum && candidates.some((c) => toAlnumLookupKey(c) === needleAlnum)) return true;

    if (item.name && String(item.name).trim().toLowerCase() === needleLower) return true;
    return false;
  });
}

export function buildUnifiedBrandKeys(brand: {
  id?: string;
  slug?: string;
  englishName?: string;
  name?: string;
  titoStudioClinicId?: string;
  agentBrandId?: string;
}): {
  canonicalId: string;
  slug: string;
  titoStudioClinicId: string;
  agentBrandId: string;
} {
  const baseSlug = toCanonicalSlug(
    String(brand.slug || brand.englishName || brand.id || `brand-${crypto.randomBytes(3).toString("hex")}`)
  );
  const canonicalId = String(brand.id || baseSlug.replace(/-/g, "_")).trim();
  const titoStudioClinicId = String(brand.titoStudioClinicId || canonicalId).trim();
  const agentBrandId = toCanonicalAgentId(String(brand.agentBrandId || baseSlug));
  return {
    canonicalId,
    slug: baseSlug,
    titoStudioClinicId,
    agentBrandId,
  };
}
