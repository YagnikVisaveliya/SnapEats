import mongoose, {Schema, Document} from "mongoose";

export interface IOrder extends Document {
    userId: string;
    userEmail: string;
    restaurantId: string;
    restaurantName: string;
    riderId?: string;
    riderName?: string;
    riderPhone?: string;
    distance: number;
    riderEarning: number;

    items: {
        itemId: string;
        name: string;
        price: number;
        quantity: number;
    }[];

    subTotal: number;
    deliveryCharge: number;
    platformCharge: number;
    totalAmount: number;
    otp: number;

    addressId: string;
    deliveryAddress: {
        fromattedAddress: string;
        mobile: number;
        latitude: number;
        longitude: number;
    };

    status:
        | "placed"
        | "accepted"
        | "preparing"
        | "ready_for_rider"
        | "rider_assigned"
        | "picked_up"
        | "delivered"
        | "cancelled";

    paymentMethod: "razorpay" | "stripe";
    paymentStatus: "pending" | "paid" | "failed" | "refunded";

    expireAt: Date;

    createdAt: Date;
    updatedAt: Date;

}

export const orderSchema: Schema = new Schema({
    userId: {
        type: String,
        required: true,
    },
    userEmail: {
        type: String,
        required: true,
    },
    restaurantId: {
        type: String,
        required: true,
    },
    restaurantName: {
        type: String,
        required: true,
    },
    riderId: {
        type: String,
        default: null,
    },
    riderName: {
      type: String,
      default: null,
    },
    riderPhone: {
      type: Number,
      default: null,
    },
    riderEarning: {
      type: Number,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    
    items: [
        {
            itemId: String,
            name: String,
            price: Number,
            quantity: Number,
        },
    ],

    subTotal: Number,
    deliveryCharge: Number,
    platformCharge: Number,
    totalAmount: Number,
    otp: {
      type: Number,
      required: true,
    },

    addressId: {
        type: String,
        required: true,
    },

    deliveryAddress: {
      fromattedAddress: { type: String, required: true },
      mobile: { type: Number, required: true },
      latitude: Number,
      longitude: Number,
    },

    status: {
      type: String,
      enum: [
        "placed",
        "accepted",
        "preparing",
        "ready_for_rider",
        "rider_assigned",
        "picked_up",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    paymentMethod: {
      type: String,
      enum: ["razorpay", "stripe"],
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },

    expireAt: {
      type: Date,
      index: { expireAfterSeconds: 0 },
    },
},
{
    timestamps: true,
});

export const Order = mongoose.model<IOrder>('Order', orderSchema);