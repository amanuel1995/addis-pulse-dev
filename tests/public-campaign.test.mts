import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPublicCampaignViewModel,
  classifyPublicLandingResponse,
  isSerializableCampaignViewModel,
  normalizeRpcRecord,
  PublicCampaignValidationError,
} from "../src/lib/passenger-flow/public-campaign.ts";

const campaignId = "10000000-0000-4000-8000-000000000001";
const companyId = "20000000-0000-4000-8000-000000000001";

function landing(overrides: Record<string, unknown> = {}) {
  return {
    available: true,
    company: {
      id: companyId,
      name: "Test Advertiser",
      logo_path: "logos/test.svg",
      brand_color: "#771c0f",
      description: "A public campaign partner.",
      services_summary: "Choose what interests you.",
      public_contact_email: "campaign@example.test",
      public_contact_phone: "+251911234567",
      whatsapp_url: "+251911234567",
      services: [{ id: "service-1", name: "Service one", description: "Details" }],
    },
    campaign: {
      id: campaignId,
      name: "Test Campaign",
      reward_description: "Subject to campaign terms.",
      brochure_path: "brochures/test.pdf",
      content: {
        locale: "en",
        content_version: 2,
        headline: "A verified campaign",
        description: "Campaign details.",
        call_to_action: "Continue",
      },
    },
    video: {
      provider: "supabase_storage",
      path: "videos/test.mp4",
      poster_path: "posters/test.webp",
      caption: "Campaign video",
    },
    ...overrides,
  };
}

function viewModel(data: unknown) {
  return buildPublicCampaignViewModel({
    landingData: data,
    driverData: { driver_name: "Test Driver" },
    locale: "en",
    resolveStorageAsset: (bucket, path) => `https://project.supabase.co/storage/v1/object/public/${bucket}/${path}`,
  });
}

test("normalizes RPC single-object and one-row array responses", () => {
  assert.deepEqual(normalizeRpcRecord([landing()]), landing());
  assert.equal(viewModel(landing()).content.headline, "A verified campaign");
  assert.equal(viewModel([landing()]).advertiser.name, "Test Advertiser");
});

test("valid campaign produces branding and a serializable view model", () => {
  const campaign = viewModel(landing());
  assert.equal(campaign.name, "Test Campaign");
  assert.equal(campaign.advertiser.logoUrl?.includes("company-assets/logos/test.svg"), true);
  assert.equal(campaign.branding.primaryColor, "#771C0F");
  assert.deepEqual(isSerializableCampaignViewModel(campaign), campaign);
});

test("accepts deterministic PostgreSQL UUID fixtures without RFC version bits", () => {
  const data = landing({
    company: { ...landing().company, id: "20000000-0000-0000-0000-000000000001" },
    campaign: { ...landing().campaign, id: "30000000-0000-0000-0000-000000000001" },
  });
  assert.equal(viewModel(data).id, "30000000-0000-0000-0000-000000000001");
});

test("missing optional translation, media, brochure, and interests use safe fallbacks", () => {
  const data = landing({
    company: { id: companyId, name: "No Assets Advertiser", services: [] },
    campaign: { id: campaignId, name: "No Assets Campaign", content: null },
    video: null,
  });
  const campaign = viewModel(data);
  assert.equal(campaign.content.headline, "An offer from No Assets Advertiser");
  assert.equal(campaign.advertiser.logoUrl, null);
  assert.equal(campaign.media.videoUrl, null);
  assert.equal(campaign.media.posterUrl, null);
  assert.equal(campaign.brochureUrl, null);
  assert.deepEqual(campaign.interests, []);
});

test("malformed optional URLs and colors are removed instead of crashing rendering", () => {
  const data = landing({
    company: {
      id: companyId,
      name: "Safe Advertiser",
      logo_path: "../private/logo.svg",
      brand_color: "not-a-color",
      whatsapp_url: "javascript:alert(1)",
      services: [],
    },
    campaign: { id: campaignId, name: "Safe Campaign", brochure_path: "http://unsafe.test/file.pdf", content: null },
    video: { provider: "external", url: "javascript:alert(1)", poster_path: "/absolute/poster.png" },
  });
  const campaign = viewModel(data);
  assert.equal(campaign.advertiser.logoUrl, null);
  assert.equal(campaign.branding.primaryColor, "#771C0F");
  assert.equal(campaign.contact.whatsapp, null);
  assert.equal(campaign.media.videoUrl, null);
  assert.equal(campaign.media.posterUrl, null);
  assert.equal(campaign.brochureUrl, null);
});

test("invalid required campaign identity is rejected with safe issue paths", () => {
  assert.throws(
    () => viewModel(landing({ campaign: { id: "bad", name: "", content: null } })),
    (error) => {
      assert.equal(error instanceof PublicCampaignValidationError, true);
      assert.equal((error as PublicCampaignValidationError).issues.some((issue) => issue.path === "campaign.id"), true);
      return true;
    },
  );
});

test("landing envelope classification preserves active, inactive, and invalid QR states", () => {
  assert.deepEqual(classifyPublicLandingResponse(landing()), { state: "available" });
  assert.deepEqual(classifyPublicLandingResponse({ available: false, reason: "invalid_qr" }), { state: "not_found" });
  assert.deepEqual(classifyPublicLandingResponse({ available: false, reason: "no_active_campaign" }), { state: "unavailable" });
  assert.deepEqual(classifyPublicLandingResponse("bad payload"), { state: "invalid" });
});
