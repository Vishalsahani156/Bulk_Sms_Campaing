import { getEnv } from "../../config/env.js";
import type { SmsProvider, SmsSendResult } from "./sms.provider.js";

export class Msg91Provider implements SmsProvider {
  private authKey: string;
  private senderId: string;

  constructor() {
    const env = getEnv();
    this.authKey = env.MSG91_AUTH_KEY ?? "";
    this.senderId = env.MSG91_SENDER_ID ?? "PULSE";
  }

  async sendSms(to: string, message: string, senderId: string): Promise<SmsSendResult> {
    if (!this.authKey) {
      return { success: false, error: "MSG91_AUTH_KEY not configured" };
    }
    try {
      const res = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          authkey: this.authKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template_id: "default",
          short_url: "0",
          recipients: [{ mobiles: to.replace("+", ""), message }],
          sender: senderId || this.senderId,
        }),
      });
      const data = (await res.json()) as { type?: string; message?: string };
      if (!res.ok) return { success: false, error: data.message ?? "MSG91 error" };
      return { success: true, messageId: `msg91_${Date.now()}` };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "MSG91 failed" };
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
