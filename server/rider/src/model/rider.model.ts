import mongoose,{Document, Schema} from "mongoose"; 

export interface IRider extends Document {
    userId: string;
    picture: string;
    phoneNumber: string;
    aadharNumber: string;
    drivingLicenseNumber: string;
    isVerified: boolean;
    location: {
        type: "point";
        coordinates: [number, number];
    };
    isAvailable: boolean;
    lastActiveAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

const RiderSchema: Schema = new Schema<IRider>(
    {
        userId: {
            type: String,
            required: true,
            unique: true,
        },
        picture: {
            type: String,
            required: true,
        },
        phoneNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        aadharNumber: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        drivingLicenseNumber: { 
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        location: {
            type: {
                type: String,
                enum: ["point"],
                default: "point",
            },
            coordinates: {
                type: [Number],
                required: true,
            },  
        },
        isAvailable: {
            type: Boolean,
            default: false,
        },
        lastActiveAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
)

RiderSchema.index({ location: "2dsphere" });

export const Rider = mongoose.model<IRider>("Rider", RiderSchema);  