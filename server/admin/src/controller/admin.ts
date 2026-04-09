import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { getRestaurantCollection,getRiderCollection } from "../utils/collection.js";

export const getPendingRestaurants = async (req: Request, res: Response) => {
    const restaurants = await (await getRestaurantCollection()).find({ isVerified: false }).toArray();

    res.json({
        count: restaurants.length,
        restaurants
    })
}

export const getPendingRiders = async (req: Request, res: Response) => {
    const riders = await (await getRiderCollection()).find({ isVerified: false }).toArray();

    res.json({
        count: riders.length,
        riders
    })
}

export const verifyRestaurant = async (req: Request, res: Response) => {
    const { id } = req.params;

    if(typeof id !== "string") {
        return res.status(400).json({
            message: "Invalid restaurant id"
        })
    }
    if(!ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid restaurant id"
        })
    }

    const restaurant = await (await getRestaurantCollection()).updateOne({ _id: new ObjectId(id) }, { $set: { isVerified: true, updatedAt: new Date() } });

    if(restaurant.matchedCount === 0) {
        return res.status(404).json({
            message: "Restaurant not found"
        })
    }
    res.json({ message: "Restaurant verified successfully" });
}

export const verifyRider = async (req: Request, res: Response) => {
    const { id } = req.params;

    if(typeof id !== "string") {
        return res.status(400).json({
            message: "Invalid rider id"
        })
    }
    if(!ObjectId.isValid(id)) {
        return res.status(400).json({
            message: "Invalid rider id"
        })
    }

    const rider = await (await getRiderCollection()).updateOne({ _id: new ObjectId(id) }, { $set: { isVerified: true, updatedAt: new Date() } });

    if(rider.matchedCount === 0) {
        return res.status(404).json({
            message: "Rider not found"
        })
    }
    res.json({ message: "Rider verified successfully" });
}