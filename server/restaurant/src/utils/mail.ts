import nodemailer from "nodemailer";

/**
 * Sends an order confirmation email to the customer
 * @param to Customer email address
 * @param orderDetails Details of the order
 */


export const sendOrderEmail = async (to: string, restaurantName: string, otp: number) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn(
        "⚠️ SMTP credentials are missing. Set SMTP_USER and SMTP_PASS in restaurant/.env to enable order confirmation emails."
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SnapEats" <${smtpUser}>`,
      to: to,
      subject: "Order Placed Successfully! - SnapEats",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #ff4757; text-align: center;">Thank You for Your Order!</h2>
          <p>Hi there,</p>
          <p>Your order for <strong>${restaurantName}</strong> restaurant has been successfully placed and is being prepared.</p>
          <div style="background-color: #f1f2f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #57606f;">Your Delivery OTP is:</p>
            <h1 style="margin: 5px 0; letter-spacing: 5px; color: #2f3542;">${otp}</h1>
          </div>
          <p>Please share this OTP with the rider only when you receive your meal.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #a4b0be; text-align: center;">Enjoy your SnapEats!<br>© 2026 SnapEats Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error);
    return false;
  }
};
