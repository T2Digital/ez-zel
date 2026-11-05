/**
 * Sovereign Brand Vault for The Shadow (D:\ez-zel-)
 * Single Source of Truth for all 15 managed enterprise brands,
 * catalogs, palettes, and Meta Page Access Tokens.
 */

export interface BrandConfig {
  id: string;
  name: string;
  category: string;
  metaPageId: string;
  metaPageToken: string;
  phone: string;
  whatsapp: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  catalog: Record<string, any>;
  pricingRules: Record<string, any>;
}

export const BRAND_VAULT: Record<string, BrandConfig> = {
  clean_master: {
    id: 'clean_master',
    name: 'كلين ماستر لخدمات النظافة والتعقيم',
    category: 'خدمات نظافة وتعقيم متخصصة',
    metaPageId: '355285914324865',
    metaPageToken: 'EAAaEIxaL5OsBSZCSwZA9n1qkPw0UoQZCRqepPbpApFyRzwYcnJp8iHNVuoQSdDnqInAC8jolZAm2pDhH6K0wVc7ggfwKu8lFPt0qpvrHDzZAauB56WA7XCmPZBvQZBsryIu8bpftzT0mTAg4DjE5ZB9QiIvfnuuDZA9uZC2T0iv5noJc0bvAWaGoHsUEBxH2vAupflgSWJQiMwR7Ms4pOJHaQtcAY0mymrhnAZBBiGkSZBaUuwZDZD',
    phone: '01013373634',
    whatsapp: '01013373634',
    primaryColor: '#13343B',
    accentColor: '#21808D',
    logoUrl: 'https://i.ibb.co/f52dPHc/1000049048.jpg',
    catalog: {
      mosqueCarpets: {
        name: 'غسيل سجاد وموكيت المساجد ودور العبادة بالبخار الحار',
        pricePerMeter: 7,
        unit: 'ج.م / م²'
      },
      homeDeepCleaning: {
        name: 'تنظيف وتطهير المنازل والشقق بالمتر المربع',
        standardCleaning: 10,
        finishingCleaning: 13,
        deepCleaning: 14,
        unit: 'ج.م / م²'
      },
      sofaUpholstery: {
        name: 'غسيل وتعقيم أطقم الانتريه والصالون بالرغوة الجافة والشفط الإيطالي',
        pricePerSet: 350,
        unit: 'ج.م / طقم'
      }
    },
    pricingRules: {
      depositPct: 25,
      electronicDiscountPct: 10,
      paymentMethods: ['Instapay', 'Vodafone Cash'],
      paymentPhone: '01013373634',
      serviceAreas: ['التجمع الخامس والقاهرة الجديدة', 'الشيخ زايد', '6 أكتوبر', 'المعادي', 'مدينتي', 'الرحاب']
    }
  },
  tito_media: {
    id: 'tito_media',
    name: 'تيتو ميديا - T2 Media',
    category: 'وكالة تسويق ودعاية وإنتاج',
    metaPageId: '111155044732876',
    metaPageToken: 'EAAaEIxaL5OsBSySXB8UotDNkwRuzodRqKYrPXLZCdsaIZBlD7HGQiac3fMB2hljZBGjZAIZAZCdr9dOhmQWUYGg0ZAmnmwl3JZApNeGjpmb0p1XKvmAsCznA08KXcQtobengi7WVZCQ5LfxNx0fXSHwUUzR4X1i8hKw4Y2wZCcUj4zZA8zg3vP72JkUdI9um0NPRRVYgZBWWZCh2OfYi6mStOOIQqb0G7tHZAG6ulZAxHIvZAZCcV',
    phone: '01013373634',
    whatsapp: '01013373634',
    primaryColor: '#6366F1',
    accentColor: '#8B5CF6',
    logoUrl: 'https://i.ibb.co/f52dPHc/1000049048.jpg',
    catalog: {},
    pricingRules: {}
  }
};

export function getBrandConfig(brandId: string): BrandConfig | undefined {
  return BRAND_VAULT[brandId];
}
