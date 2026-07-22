import assert from "node:assert/strict";
import test from "node:test";
import {
  leadSubmissionSchema,
  normalizeEthiopianPhone,
} from "../src/lib/passenger-flow/validation.ts";
import { ETHIOPIAN_PHONE_INPUT_PATTERN } from "../src/lib/passenger-flow/phone.ts";

test("normalizes supported Ethiopian mobile formats", () => {
  assert.equal(normalizeEthiopianPhone("0911 234 567"), "+251911234567");
  assert.equal(normalizeEthiopianPhone("+251-711-234-567"), "+251711234567");
  assert.equal(normalizeEthiopianPhone("251911234567"), "+251911234567");
});

test("rejects invalid and non-mobile phone numbers", () => {
  assert.equal(normalizeEthiopianPhone("+251111234567"), null);
  assert.equal(normalizeEthiopianPhone("091123"), null);
});

test("browser phone pattern accepts every supported Ethiopian input format", () => {
  const browserPattern = new RegExp(
    `^(?:${ETHIOPIAN_PHONE_INPUT_PATTERN})$`,
    "v",
  );

  for (const phone of [
    "0911234567",
    "0911 234 567",
    "+251911234567",
    "+251-711-234-567",
    "251 (911) 234-567",
    "911234567",
  ]) {
    assert.equal(browserPattern.test(phone), true, phone);
  }

  for (const phone of ["+251111234567", "091123", "not-a-phone"]) {
    assert.equal(browserPattern.test(phone), false, phone);
  }
});

test("requires consent and a valid idempotency key", () => {
  const base = {
    qrToken: "fake-alpha-driver-1",
    idempotencyKey: "a1000000-0000-4000-8000-000000000001",
    fullName: "Fake Passenger",
    phone: "0911234567",
    email: "passenger@example.test",
    consentGiven: true,
    privacyNoticeVersion: "2026-07-v1",
  } as const;
  assert.equal(leadSubmissionSchema.safeParse(base).success, true);
  assert.equal(
    leadSubmissionSchema.safeParse({ ...base, consentGiven: false }).success,
    false,
  );
  assert.equal(
    leadSubmissionSchema.safeParse({ ...base, idempotencyKey: "not-a-uuid" })
      .success,
    false,
  );
});
