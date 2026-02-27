import mongoose, {Schema, Document} from "mongoose";  

export interface IAddress extends Document {
    userId: string;
    mobile: number;

    formattedAddress: string;

    location: {
        type: "Point";
        coordinates: [number, number]; //[longitude, latitude]
    };
    createdAt: Date;
    updatedAt: Date;
}

const addressSchema = new Schema<IAddress>({
    userId: {
        type: String,
        required: true,
    },
    mobile: {
        type: Number,
        required: true,
    },
    formattedAddress: {
        type: String,
        required: true,
    },
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point",
            required: true,
        },
        coordinates: {  
            type: [Number],
            required: true,
        },
    },
}, {
    timestamps: true,
})

addressSchema.index({ location: "2dsphere" });

export const Address = mongoose.model<IAddress>("Address", addressSchema);