export type OtpProviderErrorCode =
  | "sandbox_recipient_required"
  | "provider_rejected"
  | "provider_unavailable";

export class OtpProviderDeliveryError extends Error {
  readonly code: OtpProviderErrorCode;

  constructor(code: OtpProviderErrorCode) {
    super(code);
    this.code = code;
    this.name = "OtpProviderDeliveryError";
  }
}

export function classifyRecipientFailure(input: {
  username: string;
  status?: string;
}): OtpProviderErrorCode {
  if (input.username !== "sandbox") return "provider_rejected";

  const status = input.status?.toLowerCase() || "";
  const accountOrGatewayFailure = [
    "authentication",
    "insufficient balance",
    "rejected by gateway",
    "risk hold",
  ].some((reason) => status.includes(reason));

  return accountOrGatewayFailure
    ? "provider_rejected"
    : "sandbox_recipient_required";
}
