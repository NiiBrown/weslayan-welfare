// SMS Service - abstraction layer for multiple providers
// Supports: Hubtel, Africa's Talking, Twilio
// Configure in .env and AppSettings

interface SmsPayload {
  to: string;
  message: string;
  senderId?: string;
}

interface SmsResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// Hubtel SMS
async function sendHubtel(payload: SmsPayload): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  const apiSecret = process.env.SMS_API_SECRET;
  const senderId = payload.senderId || process.env.SMS_SENDER_ID || "WWA";

  if (!apiKey || !apiSecret) {
    return { success: false, error: "Hubtel API credentials not configured" };
  }

  try {
    const response = await fetch(
      `https://smsc.hubtel.com/v1/messages/send?clientid=${apiKey}&clientsecret=${apiSecret}&from=${senderId}&to=${payload.to}&content=${encodeURIComponent(payload.message)}`,
      { method: "GET" }
    );
    const data = await response.json();
    return { success: data.status === 0, messageId: data.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Africa's Talking SMS
async function sendAfricasTalking(payload: SmsPayload): Promise<SmsResult> {
  const apiKey = process.env.SMS_API_KEY;
  const username = process.env.SMS_USERNAME || "sandbox";
  const senderId = payload.senderId || process.env.SMS_SENDER_ID || "WWA";

  if (!apiKey) {
    return { success: false, error: "Africa's Talking API key not configured" };
  }

  try {
    const response = await fetch("https://api.africastalking.com/version1/messaging", {
      method: "POST",
      headers: {
        "apiKey": apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body: new URLSearchParams({
        username,
        to: payload.to,
        message: payload.message,
        from: senderId,
      }),
    });
    const data = await response.json();
    const recipient = data.SMSMessageData?.Recipients?.[0];
    return {
      success: recipient?.status === "Success",
      messageId: recipient?.messageId,
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Twilio SMS
async function sendTwilio(payload: SmsPayload): Promise<SmsResult> {
  const accountSid = process.env.SMS_API_KEY;
  const authToken = process.env.SMS_API_SECRET;
  const fromNumber = process.env.SMS_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { success: false, error: "Twilio credentials not configured" };
  }

  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Authorization": "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: payload.to,
          From: fromNumber,
          Body: payload.message,
        }),
      }
    );
    const data = await response.json();
    return { success: !data.error_code, messageId: data.sid };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Main send function - routes to configured provider
export async function sendSms(payload: SmsPayload): Promise<SmsResult> {
  const provider = process.env.SMS_PROVIDER || "hubtel";

  switch (provider.toLowerCase()) {
    case "hubtel":
      return sendHubtel(payload);
    case "africastalking":
      return sendAfricasTalking(payload);
    case "twilio":
      return sendTwilio(payload);
    default:
      // Dev mode - just log
      console.log(`[SMS-DEV] To: ${payload.to} | Message: ${payload.message}`);
      return { success: true, messageId: `dev-${Date.now()}` };
  }
}

// Generate reminder message for a member
export function generateReminderMessage(
  memberName: string,
  amountOwed: number,
  monthsOwing: number
): string {
  const firstName = memberName.split(" ")[0];
  return `Dear ${firstName}, you currently owe GHS ${amountOwed.toLocaleString()} for ${monthsOwing} month(s) welfare dues. Kindly make payment to support the association. Thank you.`;
}
