export type CampaignContent = {
  locale?: string;
  content_version?: number;
  headline?: string;
  subheadline?: string;
  description?: string;
  offer_text?: string;
  terms_text?: string;
  reward_text?: string;
  call_to_action?: string;
  privacy_notice_text?: string;
};

export type PublicLandingPayload = {
  available?: boolean;
  reason?: string;
  message?: string;
  company?: {
    name?: string;
    logo_path?: string;
    brand_color?: string;
    description?: string;
    services_summary?: string;
    public_contact_email?: string;
    public_contact_phone?: string;
    whatsapp_url?: string;
    website_url?: string;
    services?: Array<{ id?: string; name?: string; description?: string }>;
  };
  campaign?: {
    name?: string;
    reward_description?: string;
    brochure_path?: string;
    content?: CampaignContent;
  };
  video?: {
    provider?: string;
    url?: string;
    path?: string;
    poster_path?: string;
    caption?: string;
  };
};
