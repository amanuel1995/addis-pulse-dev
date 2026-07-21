import assert from "node:assert/strict";
import test from "node:test";
import {
  leadSubmissionSchema,
  normalizeEthiopianPhone,
} from "../src/lib/passenger-flow/validation.ts";

test("normalizes supported Ethiopian mobile formats", () => {
  assert.equal(normalizeEthiopianPhone("0911 234 567"), "+251911234567");
  assert.equal(normalizeEthiopianPhone("+251-711-234-567"), "+251711234567");
  assert.equal(normalizeEthiopianPhone("251911234567"), "+251911234567");
});

test("rejects invalid and non-mobile phone numbers", () => {
  assert.equal(normalizeEthiopianPhone("+251111234567"), null);
  assert.equal(normalizeEthiopianPhone("091123"), null);
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
