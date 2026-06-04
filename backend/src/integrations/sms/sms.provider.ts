export interface SmsSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  sendSms(to: string, message: string, senderId: string): Promise<SmsSendResult>;
  sendBatch(
    recipients: Array<{ phone: string; message: string }>,
    senderId: string,
  ): Promise<Array<SmsSendResult & { phone: string }>>;
}
