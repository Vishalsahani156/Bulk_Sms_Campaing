export const SMS_RATE_INR = {
  promotional: 0.25,
  transactional: 0.3,
  otp: 0.35,
  default: 0.25,
} as const;

export function inferPaymentMethod(method?: string): "upi" | "gpay" | "card" | "netbanking" | "wallet" {
  if (!method) return "upi";
  if (method === "upi") return "upi";
  if (method === "wallet") return "wallet";
  if (method === "card") return "card";
  if (method === "netbanking") return "netbanking";
  return "upi";
}

export function formatDecimal(value: string | number): number {
  return +Number(value).toFixed(2);
}
