import type { SmsProvider, SmsSendResult } from "./sms.provider.js";

export class MockSmsProvider implements SmsProvider {
  async sendSms(to: string, message: string, _senderId: string): Promise<SmsSendResult> {
    console.log(`[MockSMS] To: ${to}, Length: ${message.length}`);
    return { success: true, messageId: `mock_${Date.now()}_${to}` };
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
