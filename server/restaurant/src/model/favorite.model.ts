import mongoose, { Document, Schema } from "mongoose";

export interface IFavorite extends Document {
  userId: string;
  restaurantId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FavoriteSchema: Schema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    restaurantId: {
      type: mongoose.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

FavoriteSchema.index({ userId: 1, restaurantId: 1 }, { unique: true });

export const Favorite = mongoose.model<IFavorite>("Favorite", FavoriteSchema);
