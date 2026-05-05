import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import restaurantRoutes from './router/restaurant.route.js';
import manuItemRoutes from './router/manuItem.route.js';
import cartRoutes from './router/cart.route.js';
import addressRoutes from './router/address.route.js';
import orderrouter from './router/order.route.js';
import couponRoutes from './router/coupon.route.js';
import favoriteRoutes from './router/favorite.route.js';
import reviewRoutes from './router/review.route.js';
import { connectRabbitMQ } from './config/rabbitmq.js';
import { startPaymentConsumer } from './config/payment.consumer.js';

dotenv.config();

await connectRabbitMQ();
startPaymentConsumer();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", manuItemRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/address", addressRoutes);
app.use("/api/order", orderrouter);
app.use("/api/coupon", couponRoutes);
app.use("/api/favorite", favoriteRoutes);
app.use("/api/review", reviewRoutes);

app.listen(process.env.PORT || 3001, () => {
  console.log(`Restaurant service is running on port ${process.env.PORT || 3001}`);
  connectDB();
});
