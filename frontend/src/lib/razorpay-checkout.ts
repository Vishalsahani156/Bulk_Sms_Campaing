import { createBillingOrder, verifyBillingPayment } from "@/lib/api/billing.api";
import type { PaymentMethodType } from "@/types/billing";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayInstance;
  }
}

interface RazorpayCheckoutOptions {
  key: string;
  amount?: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { email?: string; name?: string };
  theme?: { color?: string };
  method?: { upi?: boolean; card?: boolean; netbanking?: boolean; wallet?: boolean };
  handler: (response: RazorpaySuccessResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

const CHECKOUT_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

let scriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay Checkout is only available in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Failed to load Razorpay")));
      return;
    }
    const script = document.createElement("script");
    script.src = CHECKOUT_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

function inferPaymentMethod(method?: string): PaymentMethodType {
  if (!method) return "upi";
  if (method === "upi") return "upi";
  if (method === "wallet") return "wallet";
  if (method === "card") return "card";
  if (method === "netbanking") return "netbanking";
  return "upi";
}

export function isRazorpayConfigured(): boolean {
  return Boolean(import.meta.env.VITE_RAZORPAY_KEY_ID);
}

export interface TopUpCheckoutInput {
  amountInr: number;
  userEmail?: string;
  userName?: string;
  onSuccess: (result: {
    amountInr: number;
    method: PaymentMethodType;
    razorpayPaymentId: string;
    razorpayOrderId: string;
    newBalance: number;
  }) => void;
  onDismiss?: () => void;
  onError?: (error: Error) => void;
}

export async function openRazorpayTopUpCheckout(input: TopUpCheckoutInput): Promise<void> {
  const publicKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
  if (!publicKey) {
    input.onError?.(
      new Error(
        "Razorpay is not configured. Add VITE_RAZORPAY_KEY_ID and server keys to your .env file.",
      ),
    );
    return;
  }

  try {
    await loadRazorpayScript();

    const order = await createBillingOrder(input.amountInr);

    if (!window.Razorpay) {
      throw new Error("Razorpay Checkout failed to initialize");
    }

    const rzp = new window.Razorpay({
      key: order.keyId,
      currency: order.currency,
      name: "Pulse SMS",
      description: `Wallet top-up — ${input.amountInr} INR`,
      order_id: order.orderId,
      prefill: {
        email: input.userEmail,
        name: input.userName,
      },
      theme: { color: "#6366f1" },
      handler: async (response) => {
        try {
          const verified = await verifyBillingPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });

          const method = inferPaymentMethod(undefined);

          input.onSuccess({
            amountInr: verified.amountInr,
            method,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            newBalance: verified.newBalance,
          });
        } catch (err) {
          input.onError?.(err instanceof Error ? err : new Error("Payment verification failed"));
        }
      },
      modal: {
        ondismiss: () => input.onDismiss?.(),
      },
    });

    rzp.open();
  } catch (err) {
    input.onError?.(err instanceof Error ? err : new Error("Could not start payment"));
  }
}
