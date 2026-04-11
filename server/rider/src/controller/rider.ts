import axios from "axios";
import getBuffer from "../config/dataUri.js";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Rider } from "../model/rider.model.js";
import { log } from "console";

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
                type: "Point",
                coordinates: [longitude, latitude],
            },
            isAvailable: false,
            isVerified: false,
        })
        return res.status(201).json({ message: "Rider profile created successfully", rider });

    } catch (error: any) {
        console.error("addRiderProfile error:", error?.response?.data || error?.message || error);

        const upstreamMessage = error?.response?.data?.message;
        if (upstreamMessage) {
            return res.status(500).json({ message: upstreamMessage });
        }

        return res.status(500).json({ message: error?.message || "Internal server error" });
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
        // console.log(rider);
        
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
            type: "Point",
            coordinates: [longitude, latitude],
        }
        rider.lastActiveAt = new Date();

        await rider.save();
        return res.json({ message: isAvailable ? "Rider is now available" : "Rider is no longer available", rider });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const acceptOrder = async (req: AuthenticatedRequest, res: any) => {
    try {
        const riderUserId = req.user?._id;
        if (!riderUserId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: "Order ID is required" });
        }
        const rider = await Rider.findOne({ userId: riderUserId, isAvailable: true });
        if (!rider) {
            return res.status(404).json({ message: "Rider not found or not available" });
        }

    const { data } = await axios.put(`${process.env.RESTAURANT_SERVICE_URL}/api/order/assign/rider`,
        {
            orderId,
            riderId: rider._id,
            riderUserId: rider.userId,
            riderName: req.user?.name || rider.userId,
            riderPhone: rider.phoneNumber,            
        },
        {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
            },
        }
       ) 
       if(data?.success) {
        await Rider.findOneAndUpdate({
            userId: riderUserId,
            isAvailable: true,
        },
        {
            isAvailable: false,

        },
        { new: true }
        );
        return res.json({ message: "Order accepted successfully" });
       }

       return res.status(409).json({ message: data?.message || "Order could not be accepted" });

    } catch (error: any) {
        const upstreamStatus = error?.response?.status;
        const upstreamMessage = error?.response?.data?.message;
        return res
            .status(typeof upstreamStatus === "number" ? upstreamStatus : 500)
            .json({ message: upstreamMessage || "Order not accepted" });
    }
}

export const fetchMyCurrentOrders = async (req: AuthenticatedRequest, res: any) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
        return res.status(401).json({ message: "Please login" });
    }
    try {
        const rider = await Rider.findOne({ userId: riderUserId, isVerified: true, });
        if (!rider) {
            return res.status(404).json({ message: "Rider not found" });
        }

        const { data } = await axios.get(`${process.env.RESTAURANT_SERVICE_URL}/api/order/current/rider?riderId=${rider._id}`, {
            headers: {
                "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
            },
        });
        const order = data?.order ?? data ?? null;
        return res.json({ order });
    } catch (error:any) {
        const upstreamStatus = error?.response?.status;
        const upstreamMessage = error?.response?.data?.message;

        if (upstreamStatus === 404) {
            return res.json({ order: null });
        }

        return res
            .status(typeof upstreamStatus === "number" ? upstreamStatus : 500)
            .json({ message: upstreamMessage || "Failed to fetch current order" });
    }
}

export const getIncomingOrderPreview = async (req: AuthenticatedRequest, res: any) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const rider = await Rider.findOne({ userId: riderUserId, isVerified: true, isAvailable: true });
        if (!rider) {
            return res.status(404).json({ message: "Rider not found or not available" });
        }

        const { orderId } = req.params;
        if (!orderId) {
            return res.status(400).json({ message: "Order id is required" });
        }

        const { data } = await axios.get(
            `${process.env.RESTAURANT_SERVICE_URL}/api/order/rider/request/${orderId}`,
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
                },
            },
        );

        return res.json({ order: data?.order ?? null });
    } catch (error: any) {
        const upstreamStatus = error?.response?.status;
        const upstreamMessage = error?.response?.data?.message;

        return res
            .status(typeof upstreamStatus === "number" ? upstreamStatus : 500)
            .json({ message: upstreamMessage || "Failed to fetch order preview" });
    }
}

export const getDeliveredOrdersAnalytics = async (req: AuthenticatedRequest, res: any) => {
    const riderUserId = req.user?._id;
    if (!riderUserId) {
        return res.status(401).json({ message: "Please login" });
    }

    try {
        const rider = await Rider.findOne({ userId: riderUserId, isVerified: true });
        if (!rider) {
            return res.status(404).json({ message: "Rider not found" });
        }

        const range = (req.query?.range as string | undefined) || "week";

        const { data } = await axios.get(
            `${process.env.RESTAURANT_SERVICE_URL}/api/order/rider/delivered?riderId=${rider._id}&range=${range}`,
            {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
                },
            },
        );

        return res.json({
            filter: data?.filter || range,
            summary: data?.summary || {
                totalDelivered: 0,
                totalEarning: 0,
                totalDistance: 0,
                averageEarning: 0,
            },
            orders: data?.orders || [],
        });
    } catch (error: any) {
        const upstreamStatus = error?.response?.status;
        const upstreamMessage = error?.response?.data?.message;

        return res
            .status(typeof upstreamStatus === "number" ? upstreamStatus : 500)
            .json({ message: upstreamMessage || "Failed to fetch delivered order analytics" });
    }
}

export const updateOrderStatus = async (req: AuthenticatedRequest, res: any) => {
    const userId = req.user?._id;
    if(!userId) {
        return res.status(401).json({ message: "Please login" });
    }
    try {
        const rider = await Rider.findOne({ userId });

        if(!rider) {
            return res.status(404).json({ message: "Rider profile not found" });
        }

        const { orderId } = req.params;

        try {
            const { data } = await axios.put(`${process.env.RESTAURANT_SERVICE_URL}/api/order/update-status/rider`, {
                orderId,
                otp: req.body.otp, // Forward OTP for delivery verification
            }, {
                headers: {
                    "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
                },
             }
            )
            res.json({ message: data.message });
        } catch (error:any) {
            return res.status(500).json({ message: error?.response?.data?.message});
        }
    } catch (error) {
        return res.status(500).json({ message: "Internal server error" });      
    }
}