import {connectDb} from "../config/db.js";

export const getRestaurantCollection = async () => {
    const db = await connectDb("restaurant");
    return db.collection("restaurants");
}

export const getRiderCollection = async () => {
    const db = await connectDb("rider");
    return db.collection("riders");
}