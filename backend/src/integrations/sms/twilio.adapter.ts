import { getEnv } from "../../config/env.js";
import type { SmsProvider, SmsSendResult } from "./sms.provider.js";

export class TwilioProvider implements SmsProvider {
  private accountSid: string;
  private authToken: string;
  private fromNumber: string;

  constructor() {
    const env = getEnv();
    this.accountSid = env.TWILIO_ACCOUNT_SID ?? "";
    this.authToken = env.TWILIO_AUTH_TOKEN ?? "";
    this.fromNumber = env.TWILIO_FROM_NUMBER ?? "";
  }

  async sendSms(to: string, message: string, _senderId: string): Promise<SmsSendResult> {
    if (!this.accountSid || !this.authToken) {
      return { success: false, error: "Twilio credentials not configured" };
    }
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
      const body = new URLSearchParams({ To: to, From: this.fromNumber, Body: message });
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${this.accountSid}:${this.authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const data = (await res.json()) as { sid?: string; message?: string };
      if (!res.ok) return { success: false, error: data.message ?? "Twilio error" };
      return { success: true, messageId: data.sid };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Twilio failed" };
    }
  }

  async sendBatch(
    recipients: Array<{ phone: string; message: string }>,
    senderId: string,
  ) {
    return Promise.all(
      recipients.map(async (r) => ({
        phone: r.phone,
        ...(await this.sendSms(r.phone, r.message, senderId)),
      })),
    );
  }
}
