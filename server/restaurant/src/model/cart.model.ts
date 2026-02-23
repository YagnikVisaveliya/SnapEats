import mongoose, {Document, Schema} from "mongoose";

export interface ICart extends Document {
    userId: mongoose.Types.ObjectId;
    restaurantId: mongoose.Types.ObjectId;
    itemId: mongoose.Types.ObjectId;
    quantity: number;
    createdAt: Date;
    updatedAt: Date;
}

const CartSchema: Schema = new Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    restaurantId: {
        type: mongoose.Types.ObjectId,
        ref: "Restaurant",
        required: true,
        index: true
    },
    itemId: {
        type: mongoose.Types.ObjectId,
        ref: "Manu",
        required: true,
        index: true
    },
    quantity: {
        type: Number,
        default: 1,
        min: 1
    }
}, {
    timestamps: true
})
//for duplicate prevention of same item in cart for same user and restaurant instead of updating quantity we can use this unique index
CartSchema.index({ userId: 1, restaurantId: 1, itemId: 1 }, { unique: true });


export const Cart = mongoose.model<ICart>('Cart', CartSchema);