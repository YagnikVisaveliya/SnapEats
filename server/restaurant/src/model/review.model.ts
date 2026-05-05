import mongoose, { Document, Schema } from "mongoose";

export interface IReview extends Document {
  userId: string;
  userName: string;
  userImage?: string;
  restaurantId: mongoose.Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userImage: {
      type: String,
    },
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Review = mongoose.model<IReview>("Review", ReviewSchema);
