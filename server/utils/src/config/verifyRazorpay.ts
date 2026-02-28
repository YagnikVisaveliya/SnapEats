import crypto from "crypto";

export const verifyRazorpaySignature = (orderId: string,  paymentId: string, signature: string) => {

    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto.createHmac("sha256", process.env.KEY_SECRET!)
        .update(body.toString())
        .digest("hex");
    return expectedSignature === signature;

}