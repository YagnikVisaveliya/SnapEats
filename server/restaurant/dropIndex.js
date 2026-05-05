import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const dropIndex = async () => {
    try {
        const uri = process.env.MONGO_URI || "mongodb://localhost:27017/restaurant";
        console.log("Connecting to:", uri);
        await mongoose.connect(uri);
        console.log("Connected to DB");
        const db = mongoose.connection.db;
        const collections = await db.listCollections({ name: "reviews" }).toArray();
        if (collections.length > 0) {
            console.log("Found reviews collection, dropping orderId_1 index...");
            try {
                await db.collection("reviews").dropIndex("orderId_1");
                console.log("Index dropped successfully");
            }
            catch (err) {
                console.log("Error dropping index:", err.message);
            }
        }
        else {
            console.log("Reviews collection not found");
        }
        await mongoose.disconnect();
        process.exit(0);
    }
    catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
};
dropIndex();
