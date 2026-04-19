import nodemailer from "nodemailer";

/**
 * Sends loyalty bonus email to the user
 * @param to User email address
 * @param amount Bonus amount credited
 * @param orderCount Number of orders completed
 */
export const sendLoyaltyBonusEmail = async (to: string, amount: number, orderCount: number) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn(
        "⚠️ SMTP credentials are missing. Set SMTP_USER and SMTP_PASS in wallet/.env to enable loyalty bonus emails."
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SnapEats" <${smtpUser}>`,
      to: to,
      subject: "Congratulations! You've earned a Loyalty Bonus! - SnapEats",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4cd137; text-align: center;">You're a SnapEats Superstar!</h2>
          <p>Hi there,</p>
          <p>Congratulations! You've just completed your <strong>${orderCount}th order</strong> with SnapEats.</p>
          <p>As a token of our appreciation, we've added a loyalty bonus to your wallet!</p>
          <div style="background-color: #f1f2f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #57606f;">Bonus Credited:</p>
            <h1 style="margin: 5px 0; color: #4cd137;">₹${amount}</h1>
          </div>
          <p>You can use this balance for your future orders. Keep ordering and keep earning!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #a4b0be; text-align: center;">Thank you for being a loyal customer!<br>© 2026 SnapEats Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Loyalty Bonus Email sent to ${to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Loyalty Bonus email to ${to}:`, error);
    return false;
  }
};

/**
 * Sends first-order cashback email to the user
 * @param to User email address
 * @param amount Cashback amount credited
 */
export const sendFirstOrderCashbackEmail = async (to: string, amount: number) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn(
        "⚠️ SMTP credentials are missing. Set SMTP_USER and SMTP_PASS in wallet/.env to enable cashback emails."
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SnapEats" <${smtpUser}>`,
      to,
      subject: "Your first order cashback is here! - SnapEats",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4cd137; text-align: center;">Welcome to SnapEats!</h2>
          <p>Hi there,</p>
          <p>Thanks for placing your first order with SnapEats.</p>
          <p>We have credited your wallet with first-order cashback:</p>
          <div style="background-color: #f1f2f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #57606f;">Cashback Credited:</p>
            <h1 style="margin: 5px 0; color: #4cd137;">₹${amount}</h1>
          </div>
          <p>You can use this wallet balance in your upcoming orders.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #a4b0be; text-align: center;">Enjoy your meal!<br>© 2026 SnapEats Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ First-order cashback email sent to ${to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send first-order cashback email to ${to}:`, error);
    return false;
  }
};

/**
 * Sends referral reward email to the user
 * @param to User email address
 * @param amount Reward amount credited
 * @param isReferrer Whether the user is the referrer or referee
 */
export const sendReferralRewardEmail = async (to: string, amount: number, isReferrer: boolean) => {
  try {
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpUser || !smtpPass) {
      console.warn("⚠️ SMTP credentials missing for referral emails.");
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });

    const subject = isReferrer
      ? "Your friend completed their order! Here's your reward - SnapEats"
      : "Welcome to the club! Here is your referral bonus - SnapEats";

    const headline = isReferrer
      ? "Your friend had their first meal!"
      : "You've successfully used a friend's referral code!";
      
    const message = isReferrer
      ? "Thanks for spreading the word. Since your invited friend completed their first order, we've credited your wallet."
      : "Thanks for trying out SnapEats. Below is your special invite bonus credited directly to your wallet.";

    const mailOptions = {
      from: process.env.SMTP_FROM || `"SnapEats" <${smtpUser}>`,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #4cd137; text-align: center;">${headline}</h2>
          <p>Hi there,</p>
          <p>${message}</p>
          <div style="background-color: #f1f2f6; padding: 15px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #57606f;">Wallet Bonus Credited:</p>
            <h1 style="margin: 5px 0; color: #4cd137;">₹${amount}</h1>
          </div>
          <p>You can use this wallet balance towards your next delicious order.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #a4b0be; text-align: center;">Keep ordering, keep earning!<br>© 2026 SnapEats Team</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Referral email sent to ${to}. MessageID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send referral email to ${to}:`, error);
    return false;
  }
};
