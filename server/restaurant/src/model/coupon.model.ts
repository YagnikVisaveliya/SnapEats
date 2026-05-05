import mongoose, { Schema, Document } from "mongoose";

export interface ICoupon extends Document {
  code: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
  isActive: boolean;
  expiryDate: Date;
  usageLimit: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const couponSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderValue: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usageLimit: {
      type: Number,
      default: 0, // 0 means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const Coupon = mongoose.model<ICoupon>("Coupon", couponSchema);
