import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
    try {
        const connection = await amqp.connect(process.env.RABBITMQ_URL!);

        channel = await connection.createChannel();

        await channel.assertQueue(process.env.PAYMENT_QUEUE!, { durable: true });

        console.log("🐇 Connected to RabbitMQ (restaurent service)");
    } catch (error) {
        console.log("error in connecting rabbitMq", error)
    }
}

export const getChannel = () => channel;