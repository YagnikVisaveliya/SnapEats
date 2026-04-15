import mongoose, { Document, Schema } from "mongoose";

export interface IAdminLog extends Document {
  adminId: string;
  action: string;
  targetId: string;
  targetType: "RESTAURANT" | "RIDER" | "USER";

  message?: string;

  createdAt: Date;
}

const adminLogSchema = new Schema<IAdminLog>(
  {
    adminId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    targetId: {
      type: String,
      required: true,
    },
    targetType: {
      type: String,
      enum: ["RESTAURANT", "RIDER", "USER"],
      required: true,
    },
    message: String,
  },
  {
    timestamps: true,
  }
);

export const AdminLog = mongoose.model<IAdminLog>(
  "AdminLog",
  adminLogSchema
);