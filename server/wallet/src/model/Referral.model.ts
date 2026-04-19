import mongoose, { Schema, Document } from "mongoose";

export interface IReferral extends Document {
  referrerId: mongoose.Types.ObjectId | string;
  refereeId: mongoose.Types.ObjectId | string;
  refereeEmail: string;
  deviceId?: string;
  referrerReward: number;
  refereeReward: number;
  triggeredByOrderId: string;
  status: "pending" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const referralSchema = new Schema<IReferral>(
  {
    referrerId: {
      type: Schema.Types.Mixed, // allows String or ObjectId
      required: true,
    },
    refereeId: {
      type: Schema.Types.Mixed,
      required: true,
    },
    refereeEmail: {
      type: String,
      required: true,
    },
    deviceId: {
      type: String,
      default: null,
    },
    referrerReward: {
      type: Number,
      required: true,
    },
    refereeReward: {
      type: Number,
      required: true,
    },
    triggeredByOrderId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "completed",
    },
  },
  {
    timestamps: true,
  }
);

const Referral = mongoose.model<IReferral>("Referral", referralSchema);

export default Referral;
