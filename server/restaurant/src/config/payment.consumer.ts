import amqp from "amqplib";
import axios from "axios";
import { Order } from "../model/order.model.js";
import { getChannel } from "./rabbitmq.js";
// import { sendOrderEmail } from "../utils/mail.js";

export const startPaymentConsumer = async () => {
    const channel = getChannel();

    channel.consume(
        process.env.PAYMENT_QUEUE!, async (msg: amqp.ConsumeMessage | null) => {
            if(!msg) return;
            try {
                const event = JSON.parse(msg.content.toString());
                if (event.type !== "PAYMENT_SUCCESS") {
                    channel.ack(msg);
                    return;
                }

                const { orderId } = event.data;
                
                const order = await Order.findOneAndUpdate(
                    {
                        _id: orderId,
                        paymentStatus: { $ne: "paid" },
                    },
                    {
                        $set: {
                            paymentStatus: "paid",
                            status: "placed",
                        },
                        $unset: {
                            expireAt: 1,
                        }
                    },
                    { new: true }
                );
                if(!order) {
                    channel.ack(msg);
                    return;
                }

                console.log("✅ Payment updated:", order._id);
                
                // Send Confirmation Email to customer
                console.log(`[Order Debug] Sending Confirmation Email for Order: ${order._id} to ${order.userEmail}`);
                // await sendOrderEmail(order.userEmail, order.restaurantName, order.otp);

                await axios.post(`${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,{
                    event: "order:new",
                    room: `restaurant:${order.restaurantId}`,
                    payload: {
                        orderId: order._id,
                    }
                },{
                    headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
                    }
                })

            channel.ack(msg);
            } catch (error) {
                console.error("❌ Payment consumer error:", error);
            }
        },
    );
}