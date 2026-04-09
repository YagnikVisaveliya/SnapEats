import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

import adminRoutes from "./routes/admin.route.js";
app.use("/api/admin", adminRoutes);


app.listen(process.env.PORT, () => {
  console.log(`Admin server is running on port ${process.env.PORT || 3000}`);
});