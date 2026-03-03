import { Server } from "socket.io";
import http from "http";
import jwt from "jsonwebtoken";

let io: Server;

export const initSocket = (server: http.Server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
        },
    })

    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token;
            if (!token) {
                return next(new Error("Authentication error"));
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;

            if(!decoded || !decoded.user) {
                return next(new Error("Authentication error"));
            }
            socket.data.user = decoded.user;

            next();
        } catch (error) {
            console.error("Socket authentication error:", error);
            return next(new Error("Authentication error"));           
        }
    })

    io.on("connection", (socket) => {
        const user = socket.data.user;
        
        if(!user) {
            console.error("User data missing in socket connection");
            socket.disconnect();
            return;
        }
        const userId = socket.data.user._id;
        
        socket.join(`user:${userId}`);
        if(user.restaurantId) {
            socket.join(`restaurant:${user.restaurantId}`);
        }
        console.log(`User connected: ${socket.data.user.name} (${userId})`);

        console.log("socket room:",[...socket.rooms])
        
        socket.on("disconnect", () => {
            console.log(`User disconnected: ${socket.data.user.name} (${socket.data.user._id})`);
        })

    });
    return io
}

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};