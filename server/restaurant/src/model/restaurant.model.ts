import mongoose,{Document, Schema} from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  image: string;
  ownerId: string;
  phone: number;
  isVerified: boolean;

  autoLocation: {
    type: "Point";
    coordinates: [number, number]; //[longitude, latitude]
    formattedAddress: string;
  };
  isOpen: boolean;
  createdAt: Date;
}
const Restaurantschema = new Schema<IRestaurant>({
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    image: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    isVerified: {
      type: Boolean,
      required: true,
    },

    autoLocation: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      formattedAddress: {
        type: String,
      },
    },

    isOpen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

Restaurantschema.index({ autoLocation: "2dsphere" });

export const Restaurant = mongoose.model<IRestaurant>("Restaurant", Restaurantschema);
