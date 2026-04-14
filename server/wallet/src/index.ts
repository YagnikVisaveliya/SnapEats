import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import walletRoutes from "./router/wallet.route.js";
import connectDB from "./config/db.js";
import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

app.use("/api/wallet", walletRoutes);

const PORT = process.env.PORT || 3007;
app.listen(PORT, () => {
  console.log(`Wallet service is running on port ${PORT}`);
  connectDB();
  connectRabbitMQ();
});

export default app;
