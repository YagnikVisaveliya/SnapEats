import axios from "axios";
import getBuffer from "../config/dataUri.js";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Restaurant } from "../model/restaurant.model.js";
import { Response } from "express";
import jwt from "jsonwebtoken";


export const addRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const user = req.user;

        if(!user){
            return res.status(401).json({ message: "Unauthorized" });
        }

        const existingRestaurant = await Restaurant.findOne({ ownerId: user._id });
        if(existingRestaurant){
            return res.status(400).json({ message: "Restaurant already exists for this user" });
        }

        const { name, description, phone, latitude, longitude, formattedAddress } = req.body;
        if(!name || !phone || !latitude || !longitude){
            return res.status(400).json({ message: "All fields are required" });
        }

        const file = req.file;
        if(!file){
            return res.status(400).json({ message: "Restaurant image is required" });
        }

        const filebuffer = getBuffer(file);
        if(!filebuffer?.content){
            return res.status(500).json({ message: "failed to create file buffer" });
        }

        const { data: uploadResult } = await axios.post(`${process.env.UTILS_URL}/api/upload`, { file: filebuffer.content });

        const restaurant = await Restaurant.create({
            name,
            description,
            phone,
            image: uploadResult.url,
            ownerId: user._id,
            isVerified: false,
            autoLocation: {
                type: "Point",
                coordinates: [Number(longitude), Number(latitude)],
                formattedAddress
            },
        });

        res.status(201).json({
            message: "Restaurant created successfully",
            restaurant
        });
    } catch (error: any) {
        console.error("Error creating restaurant:", error?.response?.data || error?.message || error);
        const statusCode = error?.response?.status || 500;
        const message = error?.response?.data?.message || "Internal server error";
        res.status(statusCode).json({ message });
    }

}

export const getMyRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.user){
        return res.status(401).json({ message: "Unauthorized" });
    }

    const restaurant = await Restaurant.findOne({ ownerId : req.user._id });

    if(!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
    }

    if(!req.user.restaurantId){
        const token = jwt.sign({
            user: {
                ...req.user,
                restaurantId: restaurant._id
            },
        }, process.env.JWT_SECRET as string,{ expiresIn: "15d" });
        return res.json({restaurant, token});
    }
    res.json({restaurant});
}

export const updateStatusRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user){
        return res.status(401).json({ message: "PleaseLogin" });
        }
        const { status } = req.body;

        if(typeof status !== "boolean"){
            return res.status(400).json({ message: "Invalid status value" });  
        }

        const restaurant = await Restaurant.findOneAndUpdate(
            { ownerId: req.user._id },
            { isOpen: status },
            { new: true }
        );

        if(!restaurant){
            return res.status(404).json({ message: "Restaurant not found" });
        }

        res.json({
            message: `Restaurant is now ${status ? "open" : "closed"}`,
            restaurant,
        });
    } catch (error: any) {
        console.error("Error updating restaurant status:", error?.response?.data || error?.message || error);
        const statusCode = error?.response?.status || 500;
        const message = error?.response?.data?.message || "Internal server error";
        res.status(statusCode).json({ message });
    }
}

export const updateRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        if(!req.user){
            return res.status(401).json({ message:"Please Login"});
        }
        const { name, description } = req.body;

        if(!name){
            return res.status(400).json({ message: "Name is required" });
        }
        if(!description){
            return res.status(400).json({ message: "Description is required" });
        }

        const restaurant = await Restaurant.findOneAndUpdate(
            { ownerId: req.user._id },
            { name: name, description: description },
            { new: true }
        );
        if(!restaurant){
            return res.status(404).json({ message: "Restaurant not found" });
        }

        res.json({
            message: "Restaurant updated successfully",
            restaurant,
        });

    } catch (error: any) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
}
