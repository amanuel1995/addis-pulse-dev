import { z } from "zod";
import { isValidPassengerEmailInput } from "./email.ts";

const ethiopianPhone = /^(?:\+251|251|0)?(7|9)\d{8}$/;

export function normalizeEthiopianPhone(value: string) {
  const compact = value.replace(/[\s()-]/g, "");
  if (!ethiopianPhone.test(compact)) return null;
  if (compact.startsWith("+251")) return compact;
  if (compact.startsWith("251")) return `+${compact}`;
  if (compact.startsWith("0")) return `+251${compact.slice(1)}`;
  return `+251${compact}`;
}

export const leadSubmissionSchema = z.object({
  qrToken: z.string().trim().min(1).max(180),
  idempotencyKey: z.uuid(),
  fullName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(9).max(24),
  email: z.string().max(254).refine(isValidPassengerEmailInput).optional(),
  interestedService: z.string().trim().max(200).optional(),
  consentGiven: z.literal(true),
  privacyNoticeVersion: z.string().trim().min(1).max(40),
});

export const otpVerificationSchema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export const otpResendSchema = z.object({}).strict();
