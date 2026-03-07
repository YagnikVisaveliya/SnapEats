import axios from "axios";
import getBuffer from "../config/dataUri.js";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Rider } from "../model/rider.model.js";

export const addRiderProfile = async (req: AuthenticatedRequest, res: any) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if(user.role !== "rider"){
            return res.status(403).json({ message: "Forbidden - Only riders can create a profile" });
        }

        const { phoneNumber, drivingLicenseNumber, aadharNumber, latitude, longitude } = req.body;

        if (!drivingLicenseNumber || !phoneNumber || !aadharNumber || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Driving license number, phone number, and Aadhar number are required" });
        }

        const file = req.file;
        if (!file) {
            return res.status(400).json({ message: "Profile image is required" });
        }

        const fileBuffer = getBuffer(file);
        if(!fileBuffer?.content) {
            return res.status(400).json({ message: "Invalid file format" });
        }

        const { data: upload }  = await axios.post(`${process.env.UTILS_URL}/api/upload`, {
            file: fileBuffer.content,
        });

        const existingProfile = await Rider.findOne({ userId: user._id });
        if (existingProfile) {
            return res.status(400).json({ message: "Rider profile already exists" });
        }

        const rider = await Rider.create({
            userId: user._id,
            picture: upload.url,
            phoneNumber,
            drivingLicenseNumber,
            aadharNumber,
            location: {
                type: "point",
                coordinates: [longitude, latitude],
            },
            isAvailable: false,
            isVerified: false,
        })
        return res.status(201).json({ message: "Rider profile created successfully", rider });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getMyProfile = async (req: AuthenticatedRequest, res: any) => {
    if(!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    try {
        const rider = await Rider.findOne({ userId: req.user._id });
        if(!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }
        return res.json({ rider });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const updateAvailability = async (req: AuthenticatedRequest, res: any) => {
    try {
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if(user.role !== "rider"){
            return res.status(403).json({ message: "Forbidden - Only riders can update availability" });
        }

        const { isAvailable, latitude, longitude } = req.body;

        if (typeof isAvailable !== "boolean") {
            return res.status(400).json({ message: "isAvailable must be a boolean" });
        }
        if(latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Latitude and longitude are required" });
        }

        const rider = await Rider.findOne({ userId: user._id });
        if (!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }

        if(isAvailable && !rider.isVerified) {
            return res.status(400).json({ message: "Cannot update availability until profile is verified" });
        }

        rider.isAvailable = isAvailable;
        rider.location = {
            type: "point",
            coordinates: [longitude, latitude],
        }
        rider.lastActiveAt = new Date();

        await rider.save();
        return res.json({ message: isAvailable ? "Rider is now available" : "Rider is no longer available", rider });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}
