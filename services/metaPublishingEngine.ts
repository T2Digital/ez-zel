/**
 * Autonomous Meta Publishing & CTA Generator Engine
 * Powers:
 * 1. Forced Call-to-Action (WhatsApp, Messenger, App Link) on organic posts.
 * 2. Video & Reels upload via Meta Graph API v21.0.
 * 3. Real-time Lead Ads capture (leads_retrieval).
 * 4. Competitor Intelligence & Ad Library spy (ads_read).
 */

export interface MetaPublishParams {
  pageId: string;
  pageToken: string;
  message: string;
  link?: string;
  imageUrl?: string;
  ctaType?: 'WHATSAPP_MESSAGE' | 'MESSAGE_PAGE' | 'LEARN_MORE' | 'BOOK_NOW';
  clientAppUrl?: string;
}

export interface MetaVideoPublishParams {
  pageId: string;
  pageToken: string;
  title: string;
  description: string;
  videoUrl: string;
  isReels?: boolean;
}

/**
 * Publishes an organic post to Facebook with an enforced Call-to-Action button
 */
export async function publishPostWithCTA(params: MetaPublishParams) {
  const { pageId, pageToken, message, link, imageUrl, ctaType = 'WHATSAPP_MESSAGE', clientAppUrl } = params;

  const endpoint = `https://graph.facebook.com/v21.0/${pageId}/feed`;

  const payload: any = {
    message,
    access_token: pageToken
  };

  if (link || clientAppUrl) {
    payload.link = link || clientAppUrl;
  }

  // Enforce Call-to-Action based on strategy
  if (ctaType === 'WHATSAPP_MESSAGE') {
    payload.call_to_action = {
      type: 'WHATSAPP_MESSAGE'
    };
  } else if (ctaType === 'MESSAGE_PAGE') {
    payload.call_to_action = {
      type: 'MESSAGE_PAGE'
    };
  } else if (ctaType === 'LEARN_MORE' || ctaType === 'BOOK_NOW') {
    payload.call_to_action = {
      type: ctaType,
      value: {
        link: clientAppUrl || link || 'https://t2-studio.vercel.app'
      }
    };
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || 'Meta API Feed Error');
    }

    return {
      success: true,
      postId: data.id,
      ctaEnforced: ctaType,
      permalink: `https://facebook.com/${data.id}`
    };
  } catch (err: any) {
    console.error('[Meta Publish Post Error]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Publishes a Video or 9:16 Reels to Facebook Page
 */
export async function publishPageVideo(params: MetaVideoPublishParams) {
  const { pageId, pageToken, title, description, videoUrl, isReels = false } = params;

  const endpoint = `https://graph.facebook.com/v21.0/${pageId}/videos`;

  const payload: any = {
    title,
    description,
    file_url: videoUrl,
    access_token: pageToken
  };

  if (isReels) {
    payload.video_state = 'PUBLISHED';
    payload.content_category = 'REELS';
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.error) {
      throw new Error(data.error.message || 'Meta Video API Error');
    }

    return {
      success: true,
      videoId: data.id,
      isReels
    };
  } catch (err: any) {
    console.error('[Meta Publish Video Error]:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

/**
 * Fetches Lead Gen form submission details in real-time
 */
export async function fetchLeadDetails(leadgenId: string, userAccessToken: string) {
  const endpoint = `https://graph.facebook.com/v21.0/${leadgenId}?access_token=${userAccessToken}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();

    if (data.error) throw new Error(data.error.message);

    // Extract key answers: Full name, phone, email
    const answers = data.field_data || [];
    let fullName = 'عميل مهتم';
    let phone = '';
    let email = '';

    answers.forEach((field: any) => {
      const name = (field.name || '').toLowerCase();
      const val = field.values?.[0] || '';
      if (name.includes('name') || name.includes('full')) fullName = val;
      if (name.includes('phone') || name.includes('mobile')) phone = val;
      if (name.includes('email')) email = val;
    });

    return {
      success: true,
      leadId: data.id,
      createdTime: data.created_time,
      fullName,
      phone,
      email,
      rawFields: answers
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Competitor Ad Intelligence: Searches Meta Ad Library for active ads in Egypt
 */
export async function searchCompetitorAds(params: {
  searchTerms: string;
  userAccessToken: string;
  adReachedCountries?: string[];
}) {
  const { searchTerms, userAccessToken, adReachedCountries = ['EG'] } = params;
  const countries = JSON.stringify(adReachedCountries);
  const endpoint = `https://graph.facebook.com/v21.0/ads_archive?search_terms=${encodeURIComponent(searchTerms)}&ad_reached_countries=${encodeURIComponent(countries)}&ad_active_status=ACTIVE&fields=id,ad_creation_time,ad_creative_bodies,ad_creative_link_captions,ad_creative_link_titles,page_id,page_name&access_token=${userAccessToken}`;

  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    const ads = (data.data || []).map((ad: any) => ({
      adId: ad.id,
      pageName: ad.page_name,
      pageId: ad.page_id,
      startDate: ad.ad_creation_time,
      bodyText: ad.ad_creative_bodies?.[0] || '',
      title: ad.ad_creative_link_titles?.[0] || '',
      caption: ad.ad_creative_link_captions?.[0] || ''
    }));

    return {
      success: true,
      count: ads.length,
      ads
    };
  } catch (err: any) {
    return { success: false, error: err.message, ads: [] };
  }
}
