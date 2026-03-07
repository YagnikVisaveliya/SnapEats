import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';

dotenv.config();
await connectRabbitMQ();


const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

import riderRoutes from './router/rider.route.js';
import { connectRabbitMQ } from './config/rabbitMQ.js';

app.use('/api/rider', riderRoutes);

app.listen(process.env.PORT || 3005, () => {
  console.log(`Rider service is running on port ${process.env.PORT || 3005}`);
  connectDB();
});

export default app;