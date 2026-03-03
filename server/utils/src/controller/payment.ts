import axios from "axios";
import { Request, Response } from "express";
import { razorpayInstance } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";

export const createRazorPayOrder = async (req: Request,res: Response) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: "orderId is required" });
        }

        const restaurantServiceBaseUrl =
            process.env.RESTAURANT_URL ?? process.env.RESTAURANT_SERVICE;

        if (!restaurantServiceBaseUrl) {
            return res.status(500).json({
                message: "Restaurant service URL is not configured",
            });
        }

        const normalizedBaseUrl = restaurantServiceBaseUrl.trim().replace(/\/$/, "");

        const { data } = await axios.get(
            `${normalizedBaseUrl}/api/order/payment/${orderId}`,
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY!,
                },
            }
        );

        const razorPayOrder = await razorpayInstance.orders.create({
            amount: data.amount * 100,
            currency: data.currency || "INR",
            receipt: orderId,
        });

        res.json({
            razorpayOrderId: razorPayOrder.id,
            key: process.env.KEY_ID!,
        });
    } catch (error: any) {
        console.error("createRazorPayOrder error:", error?.response?.data || error?.message || error);
        return res.status(500).json({
            message: "Failed to create Razorpay order",
        });
    }
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