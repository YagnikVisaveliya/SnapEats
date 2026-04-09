import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { initSocket } from "./socket.js";
import internalRoute from "./routes/internal.js";


dotenv.config();

const app = express();
app.use(cors({ 
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "x-internal-key"],
}));
app.use(express.json());

app.use("/api/v1/internal", internalRoute);

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT || 3004, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

export default app;

