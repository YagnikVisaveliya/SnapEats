
import { Request, Response } from "express";
import { razorpayInstance } from "../config/razorpay.js";
import { verifyRazorpaySignature } from "../config/verifyRazorpay.js";
import { publishPaymentSuccess } from "../config/payment.producer.js";
import axios from "axios";
import Stripe from "stripe";

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

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const payWithStripe = async (req: Request, res: Response) => {
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [   
                {
                    price_data: {
                        currency: data.currency || "INR",
                        product_data: {
                            name: `Payment for order Food Order`,
                        },
                        unit_amount: data.amount * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.CLIENT_URL}/order-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/checkout`,
            metadata: {
                orderId,
            },  
            
        });

        res.json({
            url: session.url,
        })

    } catch (error) {
        res.status(500).json({
            message: "Stripe payment initiation failed",
        })
    }
} 

export const verifyStripePayment = async (req: Request, res: Response) => {
    const { sessionId } = req.body;
    try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if(!session){
            return res.status(400).json({ message: "payment verification failed" });
        }

        if(!session.metadata){
            return res.status(400).json({ message: "session metadata not found" });
        }

        const orderId = session.metadata.orderId ;

        if(!orderId){
            return res.status(400).json({ message: "orderId not found in session metadata" });
        }
        await publishPaymentSuccess({
            orderId,
            paymentId: sessionId,
            provider: "stripe",
        })
        res.json({
            message: "Payment verified successfully",
        })
    } catch (error) {
        res.status(500).json({
            message: "Stripe payment verification failed",
        })
    }
}