import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Review } from "../model/review.model.js";
import { Restaurant } from "../model/restaurant.model.js";
import mongoose from "mongoose";

export const addReview = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Please Login" });
        }

        const { restaurantId } = req.params;
        const { rating, comment } = req.body;

        if (!restaurantId || rating === undefined) {
            return res.status(400).json({ message: "RestaurantId and rating are required" });
        }

        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({ message: "Rating must be a number between 1 and 5" });
        }

        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: "Restaurant not found" });
        }

        const userId = user._id.toString();

        const existingReview = await Review.findOne({
            userId: userId,
            restaurantId: new mongoose.Types.ObjectId(restaurantId as string)
        });

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this restaurant" });
        }

        const review = await Review.create({
            userId: userId,
            userName: user.name || "User",
            userImage: user.image,
            restaurantId: new mongoose.Types.ObjectId(restaurantId as string),
            rating: numRating,
            comment
        });

        // Update restaurant rating using aggregation for accuracy
        const stats = await Review.aggregate([
            { $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId as string) } },
            {
                $group: {
                    _id: "$restaurantId",
                    avgRating: { $avg: "$rating" },
                    numReviews: { $sum: 1 }
                }
            }
        ]);

        if (stats.length > 0) {
            restaurant.rating = stats[0].avgRating;
            restaurant.numReviews = stats[0].numReviews;
            await restaurant.save();
        }

        return res.status(201).json({
            message: "Review added successfully",
            review
        });
    } catch (error: any) {
        console.error("Error adding review:", error);
        res.status(500).json({ message: error.message || "Internal server error" });
    }
};

export const getRestaurantReviews = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { restaurantId } = req.params;

        if (!restaurantId) {
            return res.status(400).json({ message: "restaurantId is required" });
        }

        const reviews = await Review.find({ restaurantId: new mongoose.Types.ObjectId(restaurantId as string) })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: reviews.length,
            reviews
        });
    } catch (error: any) {
        console.error("Error getting reviews:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
