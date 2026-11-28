/**
 * SMS Gateway Helper (MSG91 / Fast2SMS)
 * Sends real OTP messages to patient mobile numbers when credentials are provided.
 */

export async function sendOtpViaMsg91(phoneNumber: string, otpCode: string): Promise<{ success: boolean; error?: string }> {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;

  if (!authKey) {
    // If no MSG91 key is configured, silent bypass (falls back to on-screen demo hint)
    return { success: false, error: 'MSG91_AUTH_KEY not set' };
  }

  // Ensure 10-digit or 91-prefixed phone number
  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const formattedMobile = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  try {
    // Build query parameters cleanly with URLSearchParams
    const params = new URLSearchParams({
      authkey: authKey,
      mobile: formattedMobile,
      otp: otpCode,
    });

    // Only attach template_id if provided; otherwise MSG91 uses its default template
    if (templateId && templateId.trim()) {
      params.append('template_id', templateId.trim());
    }

    const url = `https://control.msg91.com/api/v5/otp?${params.toString()}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      console.log(`[MSG91] OTP ${otpCode} sent successfully to ${formattedMobile}`);
      return { success: true };
    } else {
      console.warn(`[MSG91] Failed to deliver OTP:`, data);
      return { success: false, error: data.message || 'Delivery error' };
    }
  } catch (err: any) {
    console.error(`[MSG91 Error]`, err);
    return { success: false, error: err.message };
  }
}
