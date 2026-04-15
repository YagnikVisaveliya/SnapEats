import mongoose, { Document, Schema } from "mongoose";

export interface IAdminRevenue extends Document {
  date: Date;
  totalOrders: number;
  totalRevenue: number;

  commissionRevenue: number; // 10% of subTotal
  platformRevenue: number; // 5% of subTotal
  deliveryMargin: number;

  createdAt: Date;
}

const adminRevenueSchema = new Schema<IAdminRevenue>(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    commissionRevenue: {
      type: Number,
      default: 0,
    },
    platformRevenue: {
      type: Number,
      default: 0,
    },
    deliveryMargin: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminRevenue = mongoose.model<IAdminRevenue>(
  "AdminRevenue",
  adminRevenueSchema
);