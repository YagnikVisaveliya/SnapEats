import express  from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./router/auth.route.js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
  connectDB();
});

app.use("/api/auth", userRoutes);


export default app;