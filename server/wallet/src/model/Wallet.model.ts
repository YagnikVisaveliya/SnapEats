import mongoose, { Document, Schema } from "mongoose";

export interface IWallet extends Document {
  userId: string;
  balance: number;
  createdAt: Date;
  updatedAt: Date;
}

const walletSchema: Schema<IWallet> = new Schema(
  {
    userId: {
      type: String,
      required: true,
      unique: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Wallet = mongoose.model<IWallet>("Wallet", walletSchema);
export default Wallet;
