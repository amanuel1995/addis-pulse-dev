import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRecipientFailure,
  OtpProviderDeliveryError,
} from "../src/lib/otp/errors.ts";

test("live recipient failures are provider rejections", () => {
  assert.equal(
    classifyRecipientFailure({ username: "rideperk", status: "Failed" }),
    "provider_rejected",
  );
});

test("sandbox delivery failures point to the simulator recipient", () => {
  assert.equal(
    classifyRecipientFailure({ username: "sandbox", status: "Failed" }),
    "sandbox_recipient_required",
  );
});

test("sandbox account and gateway errors are not blamed on the recipient", () => {
  for (const status of [
    "Supplied authentication is invalid",
    "Insufficient balance",
    "Rejected by gateway",
    "Risk hold error",
  ]) {
    assert.equal(
      classifyRecipientFailure({ username: "sandbox", status }),
      "provider_rejected",
    );
  }
});

test("provider delivery errors preserve safe public codes", () => {
  for (const code of [
    "sandbox_recipient_required",
    "provider_rejected",
    "provider_unavailable",
  ] as const) {
    assert.equal(new OtpProviderDeliveryError(code).code, code);
  }
});
