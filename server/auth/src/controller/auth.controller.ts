import { Request, Response} from 'express';
import User from "./../model/User.model.js";
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from "../middleware/auth.middleware.js";

import { oauth2client } from "../config/googleApi.js";
import axios from 'axios';
import crypto from 'crypto';

/**
 * Generate a unique 8-char referral code like "SNAP4X8K"
 */
const generateReferralCode = (): string => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/1/I to avoid confusion
  let suffix = "";
  for (let i = 0; i < 4; i++) {
    suffix += chars[crypto.randomInt(chars.length)];
  }
  return `SNAP${suffix}`;
};

/**
 * Generate a unique referral code, retrying if collision occurs
 */
const generateUniqueReferralCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    const existing = await User.findOne({ referralCode: code });
    if (!existing) return code;
  }
  return `SNAP${crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6)}`;
};

export const loginUser = async (req:Request, res:Response) => {

    try{
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Authorization code is required" });
        }

        const googleRes = await oauth2client.getToken(code as string);
        oauth2client.setCredentials(googleRes.tokens);

        const userRes = await axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${googleRes.tokens.access_token}`);

        const {email,name,picture} = userRes.data;

        let user = await User.findOne({ email });

        if (!user) {
            const referralCode = await generateUniqueReferralCode();
            user = await User.create({ email, name, image: picture, referralCode });
        }

        const token = jwt.sign({user}, process.env.JWT_SECRET as string, { expiresIn: '15d' });

        res.status(200).json({ message: "logged in successfully", user, token });

    }catch(error){
        console.error("Error logging in user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

const allowedRoles = ["customer", "rider", "seller"];
type Role = typeof allowedRoles[number];

export const addUserRole = async (req:AuthenticatedRequest, res:Response) => {
    try {
        if(!req.user?._id) {
            return res.status(401).json({ message: "Unauthorized - User not found in request" });        
        }

        const { role } = req.body as { role: Role };

        if(!allowedRoles.includes(role)) {
            return res.status(400).json({ message: "Invalid role provided" });
        }

        const user = await User.findByIdAndUpdate(req.user._id, { role }, { new: true });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const token = jwt.sign({ user }, process.env.JWT_SECRET as string, { expiresIn: '15d' });
        res.status(200).json({ message: "Role added successfully", user, token });

    } catch (error) {
        console.error("Error adding role to user:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const profile = async (req:AuthenticatedRequest, res:Response) => {
    const userPayload = req.user;
    if (!userPayload) {
        return res.status(401).json({ message: "Unauthorized - User not found in request" });
    }

    try {
      const user = await User.findById(userPayload._id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Backfill referral code for legacy users created before referral rollout.
      if (!user.referralCode) {
        user.referralCode = await generateUniqueReferralCode();
        await user.save();
      }

      res.status(200).json({ user });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
}

/**
 * Apply a referral code
 */
export const applyReferralCode = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { referralCode } = req.body;
    if (!referralCode || typeof referralCode !== "string") {
      return res.status(400).json({ message: "Referral code is required" });
    }

    const code = referralCode.trim().toUpperCase();

    const currentUser = await User.findById(userId);
    if (!currentUser) return res.status(404).json({ message: "User not found" });

    if (currentUser.referredBy) {
      return res.status(400).json({ message: "You have already applied a referral code" });
    }

    if (currentUser.referralCode === code) {
      return res.status(400).json({ message: "You cannot use your own referral code" });
    }

    const referrer = await User.findOne({ referralCode: code });
    if (!referrer) return res.status(404).json({ message: "Invalid referral code" });

    currentUser.referredBy = code;
    await currentUser.save();

    res.json({
      message: "Referral code applied successfully!",
      referredBy: code,
      referrerName: referrer.name,
    });
  } catch (error) {
    console.error("Error applying referral code:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get user's referral info
 */
export const getReferralInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const user = await User.findById(userId).select("referralCode referredBy name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.referralCode) {
      user.referralCode = await generateUniqueReferralCode();
      await user.save();
    }

    let orderCount = 0;
    try {
      const restaurantUrl = process.env.RESTAURANT_SERVICE || "http://localhost:3001";
      const { data } = await axios.get(
        `${restaurantUrl}/api/order/internal/user-order-count/${String(userId)}`,
        {
          headers: { "x-internal-key": process.env.INTERNAL_SERVICE_KEY }
        }
      );
      orderCount = data.count ?? 0;
    } catch (err) {
      console.error("Failed to fetch order count for referral info:", err);
    }

    res.json({
      referralCode: user.referralCode,
      referredBy: user.referredBy,
      hasAppliedCode: !!user.referredBy,
      isEligibleToApply: !user.referredBy && orderCount === 0,
    });
  } catch (error) {
    console.error("Error fetching referral info:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Internal endpoints for Wallet/Restaurant Services
export const getInternalUser = async (req: Request, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const user = await User.findById(req.params.id);
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};

export const getInternalUserByCode = async (req: Request, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const user = await User.findOne({ referralCode: req.params.code });
        res.json(user);
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};