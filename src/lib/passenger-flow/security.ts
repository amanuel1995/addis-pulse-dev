import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function requiredSecret(
  name: "IP_HASH_SECRET" | "DEVICE_FP_HASH_SECRET" | "OTP_SECRET",
) {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be configured with at least 32 characters`);
  }
  return value;
}

export function hashPhone(phoneE164: string) {
  return createHmac("sha256", requiredSecret("OTP_SECRET"))
    .update(phoneE164)
    .digest("hex");
}

export function hashIp(ip: string) {
  return createHmac("sha256", requiredSecret("IP_HASH_SECRET"))
    .update(ip)
    .digest("hex");
}

export function hashDeviceFingerprint(fingerprint: string | null) {
  if (!fingerprint) return null;
  return createHmac("sha256", requiredSecret("DEVICE_FP_HASH_SECRET"))
    .update(fingerprint)
    .digest("hex");
}

type FlowPayload = { leadId: string; qrToken: string; expiresAt: number };

export function createFlowToken(payload: FlowPayload) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = createHmac("sha256", requiredSecret("OTP_SECRET"))
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${signature}`;
}

export function verifyFlowToken(token: string): FlowPayload | null {
  const [encoded, suppliedSignature] = token.split(".");
  if (!encoded || !suppliedSignature) return null;

  const expectedSignature = createHmac("sha256", requiredSecret("OTP_SECRET"))
    .update(encoded)
    .digest("base64url");
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  )
    return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as FlowPayload;
    if (!payload.leadId || !payload.qrToken || payload.expiresAt <= Date.now())
      return null;
    return payload;
  } catch {
    return null;
  }
}

export function opaqueRequestHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
