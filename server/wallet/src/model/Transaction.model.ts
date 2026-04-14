import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  userId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
  status: "PENDING" | "SUCCESS" | "FAILED";
  description: string;
  orderId?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    description: {
      type: String,
      required: true,
    },
    orderId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransaction>("Transaction", transactionSchema);
export default Transaction;
