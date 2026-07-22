export function isValidPassengerPhoneInput(value: string) {
  return /^(?:\+251|251|0)?[79]\d{8}$/.test(value.replace(/[\s()-]/g, ""));
}

export function leadErrorMessage(code?: string) {
  if (code === "invalid_phone") return "Use a valid Ethiopian mobile number beginning with 09 or 07.";
  if (code === "otp_delivery_failed") return "Your request was saved, but the verification code could not be sent. Please try again shortly.";
  if (code === "submission_limit_exceeded" || code === "daily_ip_limit_exceeded") return "This request limit has been reached. Please try again later.";
  if (code === "captcha_required") return "We need an additional security check before continuing. Please try again later.";
  if (code === "invalid_or_inactive_qr" || code === "campaign_unavailable") return "This campaign is currently unavailable.";
  return "We could not submit your request. Check your details and try again.";
}

export function otpErrorMessage(code?: string) {
  if (code === "otp_expired") return "This code has expired. Request a new one.";
  if (code === "attempts_exhausted") return "Too many attempts. Request a new code to continue.";
  if (code === "incorrect_otp") return "That verification code is incorrect.";
  if (code === "invalid_or_expired_flow") return "This verification session expired. Scan the QR code again.";
  return "Verification failed. Please try again.";
}

export function maskPassengerPhone(phone: string) {
  return phone.length < 7 ? "your phone" : `${phone.slice(0, 4)} ••• ••${phone.slice(-2)}`;
}

export function otpSecondsRemaining(expiresAt?: string | null, now = Date.now()) {
  if (!expiresAt) return 0;
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - now) / 1000));
}

export function formatOtpCountdown(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function shouldShowCampaignMedia(videoUrl?: string | null) {
  return Boolean(videoUrl);
}
