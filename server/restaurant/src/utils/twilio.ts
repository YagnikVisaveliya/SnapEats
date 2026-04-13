import twilio from "twilio";

/**
 * Sends an SMS or WhatsApp message using Twilio
 * @param to The recipient's phone number (should include country code)
 * @param body The message body
 */
export const sendSMS = async (to: string, body: string) => {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_SMS_FROM;

    console.log(`[Twilio Debug] Attempting to send message:`);
    console.log(`- From: ${fromNumber}`);
    console.log(`- To (original): ${to}`);

    if (!accountSid || !authToken || !fromNumber) {
      console.error("❌ Twilio credentials missing in environment variables");
      return;
    }

    const client = twilio(accountSid, authToken);

    // Format the 'to' number
    let formattedTo = to.toString().trim();
    if (!formattedTo.startsWith("+") && !formattedTo.startsWith("whatsapp:")) {
      formattedTo = `+91${formattedTo}`; // Assuming India default
    }

    // Auto-align WhatsApp prefix
    // If 'from' has whatsapp prefix, 'to' MUST also have it for WhatsApp messages
    const isWhatsApp = fromNumber.startsWith("whatsapp:");
    if (isWhatsApp && !formattedTo.startsWith("whatsapp:")) {
      formattedTo = `whatsapp:${formattedTo}`;
      console.log(`[Twilio Debug] Auto-added 'whatsapp:' prefix to 'to' number: ${formattedTo}`);
    } else if (!isWhatsApp && formattedTo.startsWith("whatsapp:")) {
      // If 'from' is standard SMS but 'to' has whatsapp prefix, strip it (unlikely case)
      formattedTo = formattedTo.replace("whatsapp:", "");
      console.log(`[Twilio Debug] Stripped 'whatsapp:' prefix from 'to' number for standard SMS: ${formattedTo}`);
    }

    console.log(`- To (formatted): ${formattedTo}`);

    const message = await client.messages.create({
      body: body,
      from: fromNumber, 
      to: formattedTo,
    });

    console.log(`✅ Message SID: ${message.sid}`);
    console.log(`✅ Message Status: ${message.status}`);
    
    if (message.status === 'failed' || message.status === 'undelivered') {
        console.error(`❌ Message delivery ${message.status}. Error Code: ${message.errorCode}, Error Message: ${message.errorMessage}`);
    }

  } catch (error: any) {
    console.error(`❌ Twilio Error:`, error.message);
    if (error.code === 21608) {
        console.error("💡 TIP: This looks like a Trial Account. You can only send messages to verified numbers.");
    } else if (error.code === 21211) {
        console.error("💡 TIP: The 'To' number is invalid.");
    }
  }
};
