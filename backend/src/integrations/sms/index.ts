import { getEnv } from "../../config/env.js";
import type { SmsProvider } from "./sms.provider.js";
import { MockSmsProvider } from "./mock.adapter.js";
import { Msg91Provider } from "./msg91.adapter.js";
import { TwilioProvider } from "./twilio.adapter.js";

let provider: SmsProvider | null = null;

export function getSmsProvider(): SmsProvider {
  if (provider) return provider;
  const env = getEnv();
  switch (env.SMS_PROVIDER) {
    case "msg91":
      provider = new Msg91Provider();
      break;
    case "twilio":
      provider = new TwilioProvider();
      break;
    default:
      provider = new MockSmsProvider();
  }
  return provider;
}
