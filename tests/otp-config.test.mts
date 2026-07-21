import assert from "node:assert/strict";
import test from "node:test";
import {
  generateOtpCode,
  OtpConfigurationError,
  resolveOtpProviderName,
} from "../src/lib/otp/config.ts";

test("production resolves africas_talking", () => {
  assert.equal(
    resolveOtpProviderName({
      NODE_ENV: "production",
      OTP_PROVIDER: "africas_talking",
    }),
    "africas_talking",
  );
});

test("production rejects missing, empty, fake_local, and unknown providers", () => {
  for (const provider of [
    undefined,
    "",
    "fake_local",
    "unknown",
    " africas_talking ",
  ]) {
    assert.throws(
      () =>
        resolveOtpProviderName({
          NODE_ENV: "production",
          OTP_PROVIDER: provider,
        }),
      OtpConfigurationError,
    );
  }
});

test("development permits explicitly configured fake_local", () => {
  assert.equal(
    resolveOtpProviderName({
      NODE_ENV: "development",
      OTP_PROVIDER: "fake_local",
    }),
    "fake_local",
  );
});

test("development rejects a missing provider", () => {
  assert.throws(
    () => resolveOtpProviderName({ NODE_ENV: "development" }),
    OtpConfigurationError,
  );
});

test("unknown providers are rejected outside production too", () => {
  for (const nodeEnvironment of ["development", "test", undefined]) {
    assert.throws(
      () =>
        resolveOtpProviderName({
          NODE_ENV: nodeEnvironment,
          OTP_PROVIDER: "unknown",
        }),
      OtpConfigurationError,
    );
  }
});

test("fake_local validates configured fake codes", () => {
  assert.equal(
    generateOtpCode("fake_local", {
      NODE_ENV: "test",
      OTP_FAKE_CODE: "654321",
    }),
    "654321",
  );
  assert.equal(
    generateOtpCode("fake_local", { NODE_ENV: "test" }),
    "123456",
  );

  for (const code of ["12345", "1234567", "abcdef", " 123456 "]) {
    assert.throws(
      () =>
        generateOtpCode("fake_local", {
          NODE_ENV: "test",
          OTP_FAKE_CODE: code,
        }),
      OtpConfigurationError,
    );
  }
});

test("production cannot select or generate the static fake code", () => {
  const production = {
    NODE_ENV: "production",
    OTP_PROVIDER: "africas_talking",
    OTP_FAKE_CODE: "123456",
  };

  assert.equal(
    generateOtpCode("africas_talking", production, () => 42),
    "000042",
  );
  assert.throws(
    () => generateOtpCode("fake_local", production),
    OtpConfigurationError,
  );
});
