import { Response } from "express";
import { Cart } from "../model/cart.model.js";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import mongoose from "mongoose";


export const addToCart = async (req:AuthenticatedRequest, res:Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const userId = req.user._id;
        const { restaurantId, itemId } = req.body;

        if(!mongoose.Types.ObjectId.isValid(restaurantId) || !mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({ message: "Invalid restaurantId or itemId" });
        }

        const cartFromDifferentRestaurant = await Cart.findOne({ userId, restaurantId: { $ne: restaurantId } });
        if(cartFromDifferentRestaurant) {
            return res.status(400).json({ message: "You have items from a different restaurant in your cart. Please clear your cart before adding items from another restaurant." });
        }   

        const cartItem = await Cart.findOneAndUpdate(
            { userId, restaurantId, itemId },
            {
            $inc: { quantity: 1 },
            $setOnInsert: { userId, restaurantId, itemId },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        return res.status(200).json({
            message: "Item added to cart",
            cart: cartItem,
        });

    } catch (error) {
        return res.status(500).json({ message: "Failed to add item to cart  " });
    }
}

export const fetchCart = async (req:AuthenticatedRequest, res:Response) => {
    try {
        if(!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const userId = req.user._id;
        const cartItems = await Cart.find({ userId }).populate("itemId").populate("restaurantId");

        let totalPrice = 0;
        let cartlen = 0;

        for(const cartItem of cartItems) {
            const item = cartItem.itemId as any;
            const itemPrice = Number(item?.price || 0);
            totalPrice += itemPrice * cartItem.quantity;
            cartlen += cartItem.quantity;
        }

        return res.status(200).json({
            success: true,
            cart: cartItems,
            totalPrice,
            cartlen
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });  
    }
}