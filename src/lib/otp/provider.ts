import "server-only";

import { createRequire } from "node:module";
import {
  resolveOtpProviderName,
  type OtpProviderName,
} from "@/lib/otp/config";

export type OtpDeliveryResult = {
  providerMessageId?: string;
};

export interface OtpProvider {
  send(input: { phoneE164: string; code: string }): Promise<OtpDeliveryResult>;
}

class FakeOtpProvider implements OtpProvider {
  async send(): Promise<OtpDeliveryResult> {
    if (process.env.OTP_FAKE_FAIL === "true")
      throw new Error("Fake OTP provider failure");
    return {};
  }
}

type SmsService = {
  send(options: {
    to: string[];
    senderId?: string;
    message: string;
  }): Promise<{
    SMSMessageData?: {
      Recipients?: Array<{
        messageId?: string;
        status?: string;
        statusCode?: number;
      }>;
    };
  }>;
};
type AfricaTalkingFactory = (options: { apiKey: string; username: string }) => {
  SMS: SmsService;
};

class AfricaTalkingOtpProvider implements OtpProvider {
  async send({ phoneE164, code }: { phoneE164: string; code: string }) {
    const apiKey = process.env.AT_API_KEY;
    const username = process.env.AT_USERNAME;
    if (!apiKey || !username)
      throw new Error("Africa's Talking configuration is incomplete");

    const require = createRequire(import.meta.url);
    const factory = require("africastalking") as AfricaTalkingFactory;
    const sms = factory({ apiKey, username }).SMS;
    const response = await sms.send({
      to: [phoneE164],
      senderId: process.env.AT_SENDER_ID || undefined,
      message: `Your RidePerk verification code is ${code}. It expires shortly.`,
    });
    const recipient = response.SMSMessageData?.Recipients?.[0];
    if (!recipient || recipient.status?.toLowerCase() !== "success") {
      throw new Error(
        `Africa's Talking rejected the SMS (${recipient?.statusCode ?? "unknown"})`,
      );
    }
    return {
      providerMessageId: recipient.messageId,
    };
  }
}

export function getOtpProvider(
  providerName: OtpProviderName = resolveOtpProviderName(),
): OtpProvider {
  if (providerName === "africas_talking") {
    return new AfricaTalkingOtpProvider();
  }
  return new FakeOtpProvider();
}
