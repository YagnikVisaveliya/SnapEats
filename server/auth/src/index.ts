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

app.use("/api/auth", userRoutes);

app.get("/", (_, res) => {
  res.send("Auth Server Running");
});
app.get("/ping",(req, res) => {
  res.send("pong");
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();



export default app;