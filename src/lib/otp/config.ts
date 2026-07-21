import { randomInt } from "node:crypto";

export type OtpProviderName = "africas_talking" | "fake_local";

type OtpEnvironment = {
  NODE_ENV?: string;
  OTP_PROVIDER?: string;
  OTP_FAKE_CODE?: string;
};

export class OtpConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OtpConfigurationError";
  }
}

export function resolveOtpProviderName(
  environment: OtpEnvironment = process.env,
): OtpProviderName {
  const configuredProvider = environment.OTP_PROVIDER;

  if (environment.NODE_ENV === "production") {
    if (configuredProvider !== "africas_talking") {
      throw new OtpConfigurationError(
        'OTP_PROVIDER must be explicitly set to "africas_talking" in production.',
      );
    }
    return configuredProvider;
  }

  if (
    configuredProvider === "africas_talking" ||
    configuredProvider === "fake_local"
  ) {
    return configuredProvider;
  }

  throw new OtpConfigurationError(
    'OTP_PROVIDER must be explicitly set to "africas_talking" or "fake_local".',
  );
}

export function generateOtpCode(
  providerName: OtpProviderName,
  environment: OtpEnvironment = process.env,
  generateRandomNumber: () => number = () => randomInt(0, 1_000_000),
) {
  if (providerName === "africas_talking") {
    return generateRandomNumber().toString().padStart(6, "0");
  }

  if (environment.NODE_ENV === "production") {
    throw new OtpConfigurationError(
      "The fake_local OTP provider cannot generate codes in production.",
    );
  }

  const code = environment.OTP_FAKE_CODE || "123456";
  if (!/^\d{6}$/.test(code)) {
    throw new OtpConfigurationError(
      "OTP_FAKE_CODE must contain exactly six digits.",
    );
  }
  return code;
}
