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


export const getnearbyRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { latitude, longitude, radius = 5000, search = "" } = req.query;
        if(!latitude || !longitude){
            return res.status(400).json({ message: "Latitude and longitude are required" });
        }

        const query: any = {
            isVerified: true,
        }

        if(search && typeof search === "string"){
            query.name = { $regex: search, $options: "i" };
        }

        const restaurants = await Restaurant.aggregate([
            {
                $geoNear: {
                    near: {
                        type: "Point",
                        coordinates: [Number(longitude), Number(latitude)],
                    },
                    distanceField: "distance",
                    maxDistance: Number(radius),
                    spherical: true,
                    query,
                }, 
            },
            {
                $lookup: {
                    from: "favorites",
                    let: { restId: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$restaurantId", "$$restId"] },
                                        { $eq: ["$userId", req.user ? req.user._id : null] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "favoriteData"
                }
            },
            {
                $addFields: {
                    isFavorite: { $gt: [{ $size: "$favoriteData" }, 0] },
                    distanceKm: { 
                        $round: [{ $divide: ["$distance", 1000] }, 2]
                    }
                }
            },
            {
                $project: {
                    favoriteData: 0
                }
            },
            {
                $sort: {
                    isFavorite: -1,
                    isOpen: -1,
                    distance: 1,
                }
            }
        ]);

        res.json({
            success: true,
            count: restaurants.length,
            restaurants,
        })

    } catch (error: any) {
        console.log("Error in getnearbyRestaurants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getSingleRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const id = req.params.id;
        const restaurant = await Restaurant.findById(id);

        if(!restaurant){
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({
            success: true,
            restaurant,
        });
    } catch (error: any) {
        console.log("Error in getSingleRestaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const allRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
        message: "Forbidden",
        });
    }
    try {
        const restaurants = await Restaurant.find({ isVerified: true });
        res.json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    } catch (error: any) {
        console.log("Error in allRestaurants:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getUnverifiedRestaurants = async (req: AuthenticatedRequest, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
        message: "Forbidden",
        });
    }
    try {
        const restaurants = await Restaurant.find({ isVerified: false });
        res.json({
            success: true,
            count: restaurants.length,
            restaurants,
        });
    }   
    catch (error: any) {
        console.log("Error in getUnverifiedRestaurants:", error);
        res.status(500).json({ message: "Internal server error" });
    }   
}

export const verifyRestaurant = async (req: AuthenticatedRequest, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
        message: "Forbidden",
        });
    }
    try {
        const { restaurantId, isVerified } = req.body;
        if(typeof isVerified !== "boolean"){
            return res.status(400).json({ message: "Invalid isVerified value" });
        }
        const restaurant = await Restaurant.findByIdAndUpdate(
            restaurantId,
            { isVerified }, 
            { new: true }
        );
        if(!restaurant){
            return res.status(404).json({ message: "Restaurant not found" });
        }
        res.json({
            message: `Restaurant has been ${isVerified ? "verified" : "unverified"}`,
            restaurant,
        });
    } catch (error: any) {
        console.log("Error in verifyRestaurant:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// export const reverseGeocode = async (req: AuthenticatedRequest, res: Response) => {
//     try {
//         const { latitude, longitude } = req.query;

//         if (!latitude || !longitude) {
//             return res.status(400).json({ message: "Latitude and longitude are required" });
//         }

//         const lat = Number(latitude);
//         const lon = Number(longitude);

//         if (Number.isNaN(lat) || Number.isNaN(lon)) {
//             return res.status(400).json({ message: "Invalid latitude or longitude" });
//         }

//         const { data } = await axios.get("https://nominatim.openstreetmap.org/reverse", {
//             params: {
//                 format: "json",
//                 lat,
//                 lon,
//             },
//             headers: {
//                 "User-Agent": "SnapEats/1.0 (support@snapeats.local)",
//                 "Accept-Language": "en",
//             },
//             timeout: 10000,
//         });

//         return res.status(200).json({ success: true, data });
//     } catch (error: any) {
//         console.error("Error in reverseGeocode:", error?.response?.data || error?.message || error);
//         return res.status(500).json({ message: "Failed to fetch location data" });
//     }
// }