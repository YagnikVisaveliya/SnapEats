import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Coupon } from "../model/coupon.model.js";

export const applyCoupon = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { code, subTotal } = req.body;

    if (!code || subTotal === undefined) {
      return res.status(400).json({ message: "Coupon code and subTotal are required" });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "This coupon is no longer active" });
    }

    if (new Date() > new Date(coupon.expiryDate)) {
      return res.status(400).json({ message: "This coupon has expired" });
    }

    if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "This coupon usage limit has been reached" });
    }

    if (subTotal < coupon.minOrderValue) {
      return res.status(400).json ({ message: `Minimum order value of ₹${coupon.minOrderValue} required` });
    }

    let discount = 0;
    if (coupon.discountType === "PERCENTAGE") {
      discount = (subTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else if (coupon.discountType === "FLAT") {
      discount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed subTotal
    discount = Math.min(discount, subTotal);

    res.json({
      success: true,
      discountAmount: Number(discount.toFixed(2)),
      couponCode: coupon.code,
      message: "Coupon applied successfully"
    });

  } catch (error) {
    console.error("Error applying coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAvailableCoupons = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
      $expr: {
        $or: [
          { $eq: ["$usageLimit", 0] },
          { $lt: ["$usedCount", "$usageLimit"] }
        ]
      }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      coupons
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Admin Endpoints
export const adminCreateCoupon = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { code, discountType, discountValue, minOrderValue, maxDiscount, expiryDate, usageLimit, isActive } = req.body;

    const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
    if (existingCoupon) {
      return res.status(400).json({ message: "Coupon code already exists" });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minOrderValue,
      maxDiscount,
      expiryDate,
      usageLimit,
      isActive: isActive !== undefined ? isActive : true
    });

    res.status(201).json({ success: true, coupon });
  } catch (error: any) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: error.message || "Internal server error" });
  }
};

export const adminGetCoupons = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json({ success: true, coupons });
  } catch (error) {
    console.error("Error fetching admin coupons:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const adminUpdateCoupon = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    const { id } = req.params;
    const updateData = req.body;

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, { new: true });

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.json({ success: true, coupon });
  } catch (error) {
    console.error("Error updating coupon:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
