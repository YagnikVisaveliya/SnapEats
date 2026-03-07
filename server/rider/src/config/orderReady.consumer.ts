import axios from "axios";
import { getChannel } from "./rabbitMQ.js";
import { Rider } from "../model/rider.model.js";

export const startOrderReadyConsumer = async () => {
    const channel = getChannel();

    channel.consume(
        process.env.ORDER_READY_QUEUE!,async (msg) => {
            if(!msg) return;
            try {
                console.log("Recieved message",msg.content.toString());

                const event = JSON.parse(msg.content.toString());
                if (event.type !== "ORDER_READY_FOR_RIDER") {
                    channel.ack(msg);
                    return;
                }

                const { orderId, restaurantId, location } = event.data;
                console.log("Searching rider for near me");

                const riders = await Rider.find({
                    isAvailable: true,
                    isVerified: true,
                    location: {
                        $near: {
                            $geometry: location,
                            $maxDistance: 1000, // 1 km radius
                        }
                    }
                });
                console.log(`Found ${riders.length} near by riders`)
                if(riders.length === 0) {
                    console.log("No riders available nearby");
                    channel.ack(msg);
                    return;
                }

                for(const rider of riders) {
                    console.log(`notifying rider userId: ${rider.userId}`)
                    try {
                        await axios.post(`${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,{
                            event: "order:available",
                            room: `user:${rider.userId}`,
                            payload: {
                                orderId,
                                restaurantId,
                            },
                        },
                        {
                            headers: {
                                "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
                            }
                        }
                    );
                    console.log(`Notified rider userId: ${rider.userId} successfully`)
                    } catch (error) {
                        console.error(`Failed to notify rider userId: ${rider.userId}`, error);
                    }
                }
                channel.ack(msg);
                console.log("Message Ack")

            } catch (error) {
                console.error("❌ Order Ready consumer error:", error);
            }
        }
    )
}

