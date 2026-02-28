import axios from "axios";
import { Request, Response } from "express";
import { razorpayInstance } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";

export const createRazorPayOrder = async (req: Request,res: Response) => {
    const { orderId } = req.body;

    const { data } = await axios.get(`${process.env.RESTAURANT_URL}/api/order/payment/${orderId}`, {
        headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
        }
        }
        
    );
    const razorPayOrder = await razorpayInstance.orders.create({
        amount: data.amount * 100, // Convert to paise
        currency: data.currency || "INR",
        receipt: orderId,
    })

    res.json({
        razorpayOrderId: razorPayOrder.id,
        key:process.env.KEY_SECRET!
    });
}

export const verifyPayment = async (req: Request, res: Response) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
        return res.status(400).json({ message: "Payment verification failed" });
    }

    await publishPaymentSuccess({
        orderId,
        paymentId: razorpay_payment_id,
        provider: "razorpay",
    })

    res.json({
        message: "Payment verified successfully",
    })

}   