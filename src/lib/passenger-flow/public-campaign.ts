import { z } from "zod";
import type { PublicCampaignViewModel } from "../../types/passenger";
import type { PassengerLocale } from "./i18n";

const optionalString = z.unknown().optional().transform((value) =>
  typeof value === "string" && value.trim() ? value.trim() : null,
);

// PostgreSQL accepts all canonical 128-bit UUID text values. Local fixtures use
// deterministic UUIDs whose version bits are intentionally synthetic, so the
// stricter RFC-version check in z.uuid() would reject otherwise valid DB IDs.
const postgresUuid = z.string().regex(
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
);

const campaignContentSchema = z.object({
  locale: optionalString,
  content_version: z.unknown().optional().transform((value) =>
    typeof value === "number" && Number.isFinite(value) ? value : null,
  ),
  headline: optionalString,
  subheadline: optionalString,
  description: optionalString,
  offer_text: optionalString,
  reward_text: optionalString,
  call_to_action: optionalString,
  privacy_notice_text: optionalString,
}).passthrough();

const publicCampaignSchema = z.object({
  available: z.literal(true),
  company: z.object({
    id: postgresUuid,
    name: z.string().trim().min(1),
    logo_path: optionalString,
    brand_color: optionalString,
    description: optionalString,
    services_summary: optionalString,
    public_contact_email: optionalString,
    public_contact_phone: optionalString,
    whatsapp_url: optionalString,
    services: z.unknown().transform(normalizeServices),
  }).passthrough(),
  campaign: z.object({
    id: postgresUuid,
    name: z.string().trim().min(1),
    reward_description: optionalString,
    brochure_path: optionalString,
    content: z.union([campaignContentSchema, z.null()]).optional().transform((value) => value ?? null),
  }).passthrough(),
  video: z.union([
    z.object({
      provider: optionalString,
      url: optionalString,
      path: optionalString,
      poster_path: optionalString,
      caption: optionalString,
    }).passthrough(),
    z.null(),
  ]).optional().transform((value) => value ?? null),
}).passthrough();

const driverResolutionSchema = z.object({
  driver_name: z.string().trim().min(1),
}).passthrough();

type NormalizedService = { id: string | null; name: string; description: string | null };

export type CampaignNormalizationIssue = {
  path: string;
  code: string;
};

export class PublicCampaignValidationError extends Error {
  readonly issues: CampaignNormalizationIssue[];

  constructor(issues: CampaignNormalizationIssue[]) {
    super("The public campaign response is structurally invalid.");
    this.name = "PublicCampaignValidationError";
    this.issues = issues;
  }
}

export function classifyPublicLandingResponse(value: unknown) {
  const normalized = normalizeRpcRecord(value);
  if (!isPlainRecord(normalized)) return { state: "invalid" as const };
  if (normalized.available === true) return { state: "available" as const };
  if (normalized.available === false && normalized.reason === "invalid_qr") {
    return { state: "not_found" as const };
  }
  if (normalized.available === false) return { state: "unavailable" as const };
  return { state: "invalid" as const };
}

export function normalizeRpcRecord(value: unknown): unknown {
  const first = Array.isArray(value) ? value[0] : value;
  if (typeof first !== "string") return first;
  try {
    return JSON.parse(first) as unknown;
  } catch {
    return first;
  }
}

export function rpcShape(value: unknown) {
  return {
    kind: Array.isArray(value) ? "array" : value === null ? "null" : typeof value,
    rowCount: Array.isArray(value) ? value.length : undefined,
    topLevelKeys: isPlainRecord(normalizeRpcRecord(value))
      ? Object.keys(normalizeRpcRecord(value) as Record<string, unknown>).slice(0, 16)
      : [],
  };
}

export function buildPublicCampaignViewModel({
  landingData,
  driverData,
  locale,
  resolveStorageAsset,
}: {
  landingData: unknown;
  driverData: unknown;
  locale: PassengerLocale;
  resolveStorageAsset: (bucket: "company-assets" | "campaign-videos", path: string) => string;
}): PublicCampaignViewModel {
  const landingResult = publicCampaignSchema.safeParse(normalizeRpcRecord(landingData));
  const driverResult = driverResolutionSchema.safeParse(normalizeRpcRecord(driverData));
  if (!landingResult.success || !driverResult.success) {
    const issues = [
      ...(landingResult.success ? [] : landingResult.error.issues),
      ...(driverResult.success ? [] : driverResult.error.issues),
    ].map((issue) => ({ path: issue.path.join("."), code: issue.code }));
    throw new PublicCampaignValidationError(issues);
  }

  const landing = landingResult.data;
  const campaign = landing.campaign;
  const company = landing.company;
  const content = campaign.content;
  const headline = content?.headline || `An offer from ${company.name}`;
  const description = content?.description || content?.subheadline || company.description ||
    "Explore the offer and request more information in under a minute.";
  const provider = landing.video?.provider;

  return {
    id: campaign.id,
    name: campaign.name,
    locale,
    driverName: driverResult.data.driver_name,
    advertiser: {
      name: company.name,
      logoUrl: safeAssetUrl(company.logo_path, "company-assets", resolveStorageAsset),
      description: company.description,
      servicesSummary: company.services_summary,
    },
    content: {
      headline,
      description,
      offer: content?.offer_text || campaign.reward_description,
      callToAction: content?.call_to_action || "Continue and verify phone",
      privacyNotice: content?.privacy_notice_text || null,
      privacyNoticeVersion: content?.content_version
        ? `campaign-content-v${content.content_version}`
        : "2026-07-v1",
    },
    branding: {
      primaryColor: safeHexColor(company.brand_color) || "#771C0F",
    },
    media: {
      videoUrl: safeAssetUrl(
        landing.video?.path || landing.video?.url,
        "campaign-videos",
        resolveStorageAsset,
      ),
      posterUrl: safeAssetUrl(landing.video?.poster_path, "campaign-videos", resolveStorageAsset),
      caption: landing.video?.caption || null,
      provider: provider || null,
      external: provider !== "supabase_storage",
    },
    contact: {
      phone: safePhone(company.public_contact_phone),
      email: safeEmail(company.public_contact_email),
      whatsapp: safeWhatsappUrl(company.whatsapp_url),
    },
    reward: {
      description: content?.reward_text || campaign.reward_description,
    },
    brochureUrl: safeAssetUrl(campaign.brochure_path, "campaign-videos", resolveStorageAsset),
    interests: company.services.map((service) => ({
      value: service.id || service.name,
      label: service.name,
      description: service.description,
    })),
  };
}

export function isSerializableCampaignViewModel(value: PublicCampaignViewModel) {
  try {
    return JSON.parse(JSON.stringify(value)) as PublicCampaignViewModel;
  } catch {
    return null;
  }
}

function normalizeServices(value: unknown): NormalizedService[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isPlainRecord(item) || typeof item.name !== "string" || !item.name.trim()) return [];
    return [{
      id: typeof item.id === "string" && item.id.trim() ? item.id.trim() : null,
      name: item.name.trim(),
      description: typeof item.description === "string" && item.description.trim()
        ? item.description.trim()
        : null,
    }];
  });
}

function safeAssetUrl(
  value: string | null | undefined,
  bucket: "company-assets" | "campaign-videos",
  resolveStorageAsset: (bucket: "company-assets" | "campaign-videos", path: string) => string,
) {
  if (!value) return null;
  const direct = safeHttpsUrl(value);
  if (direct) return direct;
  if (!isSafeStoragePath(value)) return null;
  return safeHttpsUrl(resolveStorageAsset(bucket, value));
}

function safeHttpsUrl(value: string) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

function isSafeStoragePath(value: string) {
  return !value.startsWith("/") && !value.includes("..") && /^[\w./@()+-]+$/.test(value);
}

function safeHexColor(value: string | null | undefined) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value.toUpperCase() : null;
}

function safePhone(value: string | null | undefined) {
  return value && /^[+\d][\d\s()-]{6,24}$/.test(value) ? value : null;
}

function safeEmail(value: string | null | undefined) {
  return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

function safeWhatsappUrl(value: string | null | undefined) {
  if (!value) return null;
  const normalizedPhone = value.replace(/[^\d]/g, "");
  if (/^251[79]\d{8}$/.test(normalizedPhone)) return `https://wa.me/${normalizedPhone}`;
  const url = safeHttpsUrl(value);
  if (!url) return null;
  const hostname = new URL(url).hostname.toLowerCase();
  return hostname === "wa.me" || hostname === "api.whatsapp.com" || hostname.endsWith(".whatsapp.com")
    ? url
    : null;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
