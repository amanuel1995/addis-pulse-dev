import assert from "node:assert/strict";
import test from "node:test";
import {
  formatOtpCountdown,
  isValidPassengerPhoneInput,
  leadErrorMessage,
  maskPassengerPhone,
  otpErrorMessage,
  otpSecondsRemaining,
  shouldShowCampaignMedia,
} from "../src/lib/passenger-flow/ui.ts";

test("passenger phone feedback accepts Ethiopian local mobile formats", () => {
  assert.equal(isValidPassengerPhoneInput("0911 234 567"), true);
  assert.equal(isValidPassengerPhoneInput("0711-234-567"), true);
  assert.equal(isValidPassengerPhoneInput("+251911234567"), true);
  assert.equal(isValidPassengerPhoneInput("0111234567"), false);
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
