import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

dotenv.config();
const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

import restaurantRoutes from './router/restaurant.route.js';
import manuItemRoutes from './router/manuItem.route.js';

app.use("/api/restaurant", restaurantRoutes);
app.use("/api/item", manuItemRoutes);

app.listen(process.env.PORT || 3001, () => {
  console.log(`Restaurant service is running on port ${process.env.PORT || 3001}`);
  connectDB();
});
