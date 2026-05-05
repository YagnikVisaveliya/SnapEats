import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Favorite } from "../model/favorite.model.js";
import mongoose from "mongoose";

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Please Login" });
        }

        const { restaurantId } = req.body;
        if (!restaurantId) {
            return res.status(400).json({ message: "restaurantId is required" });
        }

        const existingFavorite = await Favorite.findOne({
            userId: req.user._id,
            restaurantId: new mongoose.Types.ObjectId(restaurantId)
        });

        if (existingFavorite) {
            await Favorite.findByIdAndDelete(existingFavorite._id);
            return res.status(200).json({ message: "Removed from favorites", isFavorite: false });
        } else {
            await Favorite.create({
                userId: req.user._id,
                restaurantId: new mongoose.Types.ObjectId(restaurantId)
            });
            return res.status(200).json({ message: "Added to favorites", isFavorite: true });
        }
    } catch (error: any) {
        console.error("Error toggling favorite:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getMyFavorites = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Please Login" });
        }

        const favorites = await Favorite.find({ userId: req.user._id }).populate("restaurantId");
        
        return res.status(200).json({
            success: true,
            favorites
        });
    } catch (error: any) {
        console.error("Error getting favorites:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
