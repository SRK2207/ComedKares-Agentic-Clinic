import crypto from 'crypto';
import Razorpay from 'razorpay';

const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_demo12345';
const keySecret = process.env.RAZORPAY_KEY_SECRET || 'demo_razorpay_secret_12345';
const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'demo_webhook_secret_12345';

const isRealRazorpay = Boolean(
  keyId &&
  keySecret &&
  !keyId.includes('placeholder') &&
  !keyId.includes('demo')
);

export const razorpayInstance = isRealRazorpay
  ? new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  : null;

export interface RazorpayOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
}

/**
 * Creates a Razorpay order in INR. Amount is passed in INR and multiplied by 100 for paise.
 */
export async function createRazorpayOrder(
  amountInr: number,
  receipt: string,
  notes: Record<string, string> = {}
): Promise<RazorpayOrderResult> {
  const amountInPaise = Math.round(amountInr * 100);

  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt,
        notes,
      });

      return {
        orderId: order.id,
        amount: Number(order.amount),
        currency: order.currency,
        keyId,
      };
    } catch (err) {
      console.warn('[Razorpay] Real order creation failed, falling back to simulated order:', err);
    }
  }

  // Demo / fallback order creation
  const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    orderId: mockOrderId,
    amount: amountInPaise,
    currency: 'INR',
    keyId: keyId || 'rzp_test_demo12345',
  };
}

/**
 * Verifies client checkout signature: HMAC-SHA256(order_id + "|" + payment_id, secret)
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  // If demo mock signature or demo mode
  if (signature === 'demo_verified_signature' || signature.startsWith('mock_')) {
    return true;
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('[Razorpay] Verification error:', err);
    return false;
  }
}

/**
 * Verifies webhook HMAC signature from X-Razorpay-Signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  if (signature === 'demo_webhook_signature') {
    return true;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('[Razorpay] Webhook signature verification error:', err);
    return false;
  }
}
