import type { Campaign } from "@/types/sms";

export const SMS_RATE_INR = {
  promotional: 0.25,
  transactional: 0.3,
  otp: 0.35,
  default: 0.25,
} as const;

const BILLABLE_STATUSES: Campaign["status"][] = ["completed", "sending"];

export function getBillableSmsForCampaign(campaign: Campaign): number {
  if (!BILLABLE_STATUSES.includes(campaign.status)) return 0;
  if (campaign.delivered > 0) return campaign.delivered;
  return campaign.recipients;
}

export function getBillableSmsCount(campaigns: Campaign[]): number {
  return campaigns.reduce((sum, c) => sum + getBillableSmsForCampaign(c), 0);
}

export function calculateUsageChargeInr(
  smsCount: number,
  rate: number = SMS_RATE_INR.default,
): number {
  return +(smsCount * rate).toFixed(2);
}

export function calculateCampaignCostInr(campaign: Campaign): number {
  return calculateUsageChargeInr(getBillableSmsForCampaign(campaign));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatInrCompact(amount: number): string {
  if (amount >= 100_000) {
    return `₹${(amount / 100_000).toFixed(1)}L`;
  }
  if (amount >= 1_000) {
    return `₹${(amount / 1_000).toFixed(1)}K`;
  }
  return formatInr(amount);
}
