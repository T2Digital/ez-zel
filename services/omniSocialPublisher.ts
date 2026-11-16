import { getEzZelPersonalClients, getUnifiedGrowthBrands, persistBrandUpdateAcrossEcosystem } from './obsidianVaultService';
import { readPaymobSubscriptions } from './paymobService';

export type OmniPlatform = 'facebook' | 'instagram' | 'tiktok' | 'youtube' | 'telegram' | 'x' | 'linkedin' | 'snapchat';

const ALL_8_PLATFORMS: OmniPlatform[] = [
  'facebook',
  'instagram',
  'tiktok',
  'youtube',
  'telegram',
  'x',
  'linkedin',
  'snapchat'
];

export function getAllowedPlatformsForBrand(brandId: string): {
  status: 'trial' | 'paid' | 'expired';
  planId: string;
  allowedPlatforms: OmniPlatform[];
} {
  const brands = getUnifiedGrowthBrands();
  const brand = brands.find((b: any) => b.id === brandId || b.slug === brandId);
  const clients = getEzZelPersonalClients();
  const linkedClient = brand ? clients.find((c: any) => c.linkedBrandId === brand.id) : null;
  const paidSub = readPaymobSubscriptions().find(
    (s: any) => (s.brandId === brandId || s.brandId === brand?.slug) && s.status === 'paid'
  );

  if (paidSub) {
    const planId = String(paidSub.planId || 'growth_pro');
    if (planId.includes('starter') || planId.includes('launch')) {
      return { status: 'paid', planId, allowedPlatforms: ['facebook', 'instagram', 'telegram'] };
    }
    if (planId.includes('enterprise') || planId.includes('scale')) {
      return { status: 'paid', planId, allowedPlatforms: ALL_8_PLATFORMS };
    }
    return { status: 'paid', planId, allowedPlatforms: ['facebook', 'instagram', 'tiktok', 'youtube', 'telegram', 'x'] };
  }

  if (linkedClient?.status === 'trial' && linkedClient?.trialEndsAt) {
    const endMs = new Date(linkedClient.trialEndsAt).getTime();
    if (!Number.isNaN(endMs) && endMs < Date.now()) {
      return { status: 'expired', planId: 'expired', allowedPlatforms: [] };
    }
  }

  // During active 7-day trial, unlock ALL 8 platforms per Master Tito's product policy
  return { status: 'trial', planId: 'trial_7_days', allowedPlatforms: ALL_8_PLATFORMS };
}

export function buildPlatformOAuthUrl(platform: OmniPlatform, brandId: string, baseUrl: string): {
  ok: boolean;
  authUrl?: string;
  missingEnv?: string[];
  message?: string;
} {
  const redirectUri = `${baseUrl.replace(/\/$/, '')}/api/auth/social/callback/${platform}`;
  const state = encodeURIComponent(JSON.stringify({ brandId, platform }));

  if (platform === 'tiktok') {
    const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
    if (!clientKey) {
      return { ok: false, missingEnv: ['TIKTOK_CLIENT_KEY', 'TIKTOK_CLIENT_SECRET'], message: 'يرجى إضافة TIKTOK_CLIENT_KEY و TIKTOK_CLIENT_SECRET في Render لتفعيل TikTok OAuth.' };
    }
    const scope = 'user.info.basic,video.publish,video.upload';
    return {
      ok: true,
      authUrl: `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientKey)}&scope=${encodeURIComponent(scope)}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`
    };
  }

  if (platform === 'youtube') {
    const clientId = process.env.YOUTUBE_CLIENT_ID || process.env.GOOGLE_OAUTH_CLIENT_ID || '';
    if (!clientId) {
      return { ok: false, missingEnv: ['YOUTUBE_CLIENT_ID', 'YOUTUBE_CLIENT_SECRET'], message: 'يرجى إضافة YOUTUBE_CLIENT_ID و YOUTUBE_CLIENT_SECRET في Render.' };
    }
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
    return {
      ok: true,
      authUrl: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent&state=${state}`
    };
  }

  if (platform === 'linkedin') {
    const clientId = process.env.LINKEDIN_CLIENT_ID || '';
    if (!clientId) {
      return { ok: false, missingEnv: ['LINKEDIN_CLIENT_ID', 'LINKEDIN_CLIENT_SECRET'], message: 'يرجى إضافة LINKEDIN_CLIENT_ID و LINKEDIN_CLIENT_SECRET في Render.' };
    }
    const scope = 'openid profile w_member_social';
    return {
      ok: true,
      authUrl: `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${state}`
    };
  }

  if (platform === 'x') {
    const clientId = process.env.X_CLIENT_ID || '';
    if (!clientId) {
      return { ok: false, missingEnv: ['X_CLIENT_ID', 'X_CLIENT_SECRET'], message: 'يرجى إضافة X_CLIENT_ID و X_CLIENT_SECRET في Render.' };
    }
    return {
      ok: true,
      authUrl: `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('tweet.read tweet.write users.read offline.access')}&state=${state}&code_challenge=challenge&code_challenge_method=plain`
    };
  }

  return { ok: false, message: `منصة ${platform} تستخدم الربط المباشر أو رابط الحساب.` };
}

export async function publishToOmniPlatform(input: {
  platform: OmniPlatform;
  brandId: string;
  text: string;
  mediaUrl?: string;
}): Promise<{ ok: boolean; platform: OmniPlatform; postId?: string; message: string }> {
  const { platform, brandId, text, mediaUrl } = input;
  const gate = getAllowedPlatformsForBrand(brandId);
  if (!gate.allowedPlatforms.includes(platform)) {
    return {
      ok: false,
      platform,
      message: gate.status === 'expired'
        ? 'انتهت فترة التجربة المجانية — يرجى تفعيل الباقة للاستمرار في النشر التلقائي.'
        : `منصة ${platform} غير مشمولة في باقتك الحالية (${gate.planId}).`
    };
  }

  const brand: any = getUnifiedGrowthBrands().find((b: any) => b.id === brandId || b.slug === brandId);
  const tokens = brand?.socialOAuthTokens || {};

  if (platform === 'telegram') {
    const botToken = tokens.telegramBotToken || process.env.TELEGRAM_BOT_TOKEN || '';
    const chatId = brand?.socialLinks?.telegram || tokens.telegramChatId || '';
    if (!botToken || !chatId) {
      return { ok: false, platform, message: 'مطلوب TELEGRAM_BOT_TOKEN ومعرّف القناة (مثل @channel) للنشر التلقائي على تيليجرام.' };
    }
    const endpoint = mediaUrl
      ? `https://api.telegram.org/bot${botToken}/sendPhoto`
      : `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body = mediaUrl ? { chat_id: chatId, photo: mediaUrl, caption: text } : { chat_id: chatId, text };
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d: any = await r.json();
    return d.ok
      ? { ok: true, platform, postId: String(d.result?.message_id || ''), message: 'تم النشر الفوري على قناة تيليجرام بنجاح!' }
      : { ok: false, platform, message: d.description || 'فشل النشر على تيليجرام' };
  }

  if (platform === 'tiktok') {
    const accessToken = tokens.tiktok?.accessToken;
    if (!accessToken) {
      return { ok: false, platform, message: 'يرجى ربط حساب تيك توك عبر OAuth أولاً قبل النشر التلقائي.' };
    }
    if (!mediaUrl) {
      return { ok: false, platform, message: 'تيك توك يتطلب رابط فيديو (MP4) للنشر التلقائي عبر Content Posting API.' };
    }
    const r = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' },
      body: JSON.stringify({
        post_info: { title: text.slice(0, 150), privacy_level: 'PUBLIC_TO_EVERYONE' },
        source_info: { source: 'PULL_FROM_URL', video_url: mediaUrl }
      })
    });
    const d: any = await r.json();
    return d?.data?.publish_id
      ? { ok: true, platform, postId: d.data.publish_id, message: 'تم إرسال الفيديو للنشر على تيك توك بنجاح!' }
      : { ok: false, platform, message: d?.error?.message || 'فشل إرسال الفيديو إلى TikTok API' };
  }

  if (platform === 'x') {
    const accessToken = tokens.x?.accessToken;
    if (!accessToken) {
      return { ok: false, platform, message: 'يرجى ربط حساب X (Twitter) عبر OAuth أولاً.' };
    }
    const r = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.slice(0, 280) })
    });
    const d: any = await r.json();
    return d?.data?.id
      ? { ok: true, platform, postId: d.data.id, message: 'تم نشر التغريدة على X بنجاح!' }
      : { ok: false, platform, message: d?.detail || 'فشل النشر على X' };
  }

  if (platform === 'linkedin') {
    const accessToken = tokens.linkedin?.accessToken;
    const authorUrn = tokens.linkedin?.authorUrn;
    if (!accessToken || !authorUrn) {
      return { ok: false, platform, message: 'يرجى ربط حساب LinkedIn عبر OAuth أولاً.' };
    }
    const r = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'X-Restli-Protocol-Version': '2.0.0' },
      body: JSON.stringify({
        author: authorUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
      })
    });
    const d: any = await r.json();
    return d?.id
      ? { ok: true, platform, postId: d.id, message: 'تم النشر على LinkedIn بنجاح!' }
      : { ok: false, platform, message: d?.message || 'فشل النشر على LinkedIn' };
  }

  return { ok: false, platform, message: `منصة ${platform} تستخدم مسار النشر الخاص بها أو تحتاج تفعيل OAuth.` };
}

export function saveSocialOAuthToken(brandId: string, platform: OmniPlatform, tokenPayload: any) {
  const brand: any = getUnifiedGrowthBrands().find((b: any) => b.id === brandId || b.slug === brandId);
  if (!brand) return;
  persistBrandUpdateAcrossEcosystem(brand.id, {
    socialOAuthTokens: {
      ...(brand.socialOAuthTokens || {}),
      [platform]: tokenPayload
    }
  } as any);
}
