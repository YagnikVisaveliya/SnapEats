import { getChannel } from "./rabbitmq.js";

export const publishEvent = async (event: string, data: any) => {
    const channel = getChannel();

    channel.sendToQueue(
        process.env.ORDER_READY_QUEUE!,
        Buffer.from(JSON.stringify({ event, data })),
        { persistent: true }
    )
}