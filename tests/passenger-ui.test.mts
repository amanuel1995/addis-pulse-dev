import assert from "node:assert/strict";
import test from "node:test";
import {
  campaignVideoEmbedUrl,
  formatOtpCountdown,
  isValidPassengerPhoneInput,
  leadErrorMessage,
  maskPassengerPhone,
  otpErrorMessage,
  otpSecondsRemaining,
  shouldShowCampaignMedia,
  validatePassengerLeadFields,
} from "../src/lib/passenger-flow/ui.ts";
import { passengerDictionary, passengerLocale } from "../src/lib/passenger-flow/i18n.ts";

test("passenger phone feedback accepts Ethiopian local mobile formats", () => {
  assert.equal(isValidPassengerPhoneInput("0911 234 567"), true);
  assert.equal(isValidPassengerPhoneInput("0711-234-567"), true);
  assert.equal(isValidPassengerPhoneInput("+251911234567"), true);
  assert.equal(isValidPassengerPhoneInput("0111234567"), false);
});

test("lead form feedback covers required fields, email, and consent", () => {
  assert.deepEqual(
    validatePassengerLeadFields({ fullName: "", phone: "0111234567", email: "bad", consent: false }),
    {
      fullName: "Enter your full name.",
      phone: "Use an Ethiopian mobile number beginning with 09 or 07.",
      email: "Enter a valid email address or leave this field blank.",
      consent: "Confirm your consent before continuing.",
    },
  );
  assert.deepEqual(
    validatePassengerLeadFields({ fullName: "Abebe Kebede", phone: "0911234567", email: "", consent: true }),
    {},
  );
  assert.match(
    validatePassengerLeadFields({ fullName: "Abebe Kebede", phone: "0911234567", email: "አበበ123@example.com", consent: true }).email || "",
    /valid email/i,
  );
});

test("lead API errors map to safe passenger-facing messages", () => {
  assert.match(leadErrorMessage("invalid_phone"), /Ethiopian mobile number/);
  assert.match(leadErrorMessage("otp_delivery_failed"), /could not be sent/);
  assert.doesNotMatch(leadErrorMessage("internal_rpc_name"), /rpc|supabase/i);
});

test("OTP states map to focused recovery messages", () => {
  assert.match(otpErrorMessage("incorrect_otp"), /incorrect/);
  assert.match(otpErrorMessage("otp_expired"), /expired/);
  assert.match(otpErrorMessage("attempts_exhausted"), /Too many attempts/);
});

test("OTP countdown and phone masking avoid exposing full details", () => {
  const now = Date.parse("2026-07-21T00:00:00Z");
  assert.equal(otpSecondsRemaining("2026-07-21T00:01:05Z", now), 65);
  assert.equal(formatOtpCountdown(65), "1:05");
  assert.equal(maskPassengerPhone("+251911234567"), "+251 ••• ••67");
});

test("campaign media fallback is selected when media is absent", () => {
  assert.equal(shouldShowCampaignMedia(undefined), false);
  assert.equal(shouldShowCampaignMedia(null), false);
  assert.equal(shouldShowCampaignMedia("https://example.test/video.mp4"), true);
});

test("campaign video links convert to safe provider embeds", () => {
  assert.equal(
    campaignVideoEmbedUrl("youtube", "https://youtu.be/dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
  );
  assert.equal(
    campaignVideoEmbedUrl("youtube", "https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0",
  );
  assert.equal(
    campaignVideoEmbedUrl("vimeo", "https://vimeo.com/76979871"),
    "https://player.vimeo.com/video/76979871",
  );
  assert.equal(campaignVideoEmbedUrl("youtube", "https://example.com/watch?v=dQw4w9WgXcQ"), null);
});

test("passenger locales default to English and provide four dictionaries", () => {
  assert.equal(passengerLocale(undefined), "en");
  assert.equal(passengerLocale("unknown"), "en");
  assert.equal(passengerLocale("am"), "am");
  assert.match(passengerDictionary("am").welcomeTitle, /ተሳፋሪ/);
  assert.match(passengerDictionary("om").welcomeTitle, /imaltuu/i);
  assert.match(passengerDictionary("ar").welcomeTitle, /الراكب/);
});
