/**
 * Send OTP via Twilio WhatsApp. Set env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER.
 * TWILIO_PHONE_NUMBER must be a Twilio WhatsApp-enabled number (sandbox or approved).
 * If not set, logs OTP to console (dev mode) and returns success.
 */
export async function sendWhatsApp(toE164: string, body: string): Promise<{ ok: boolean; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.log("[WhatsApp dev mode] Missing:", {
      TWILIO_ACCOUNT_SID: !accountSid,
      TWILIO_AUTH_TOKEN: !authToken,
      TWILIO_PHONE_NUMBER: !fromNumber,
    }, "To:", toE164, "Body:", body);
    return { ok: true };
  }

  const from = fromNumber.startsWith("+") ? fromNumber : `+${fromNumber}`;
  const to = toE164.startsWith("+") ? toE164 : `+${toE164}`;

  try {
    const twilio = await import("twilio");
    const client = twilio.default(accountSid, authToken);
    await client.messages.create({
      body,
      from: `whatsapp:${from}`,
      to: `whatsapp:${to}`,
    });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Twilio WhatsApp error:", message);
    return { ok: false, error: message };
  }
}
