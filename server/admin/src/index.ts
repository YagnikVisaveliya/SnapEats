import express  from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import cors from "cors";

import adminRoutes from "./routes/admin.route.js";

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use("/api/admin", adminRoutes);

app.get("/", (_, res) => {
  res.send("Server Running");
});

const PORT = process.env.PORT || 3006;

connectDB();

app.listen(process.env.PORT || 3006, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;