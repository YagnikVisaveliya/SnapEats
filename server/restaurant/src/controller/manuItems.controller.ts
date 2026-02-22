import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Manu } from "../model/manu.model.js";
import { Response } from "express";
import { Restaurant } from "../model/restaurant.model.js";
import getBuffer from "../config/dataUri.js";
import axios from "axios";

export const addManuItem = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.user){
        return res.status(401).json({ message: "Please login to add menu item" });
    }

    const restaurant = await Restaurant.findOne({ ownerId: req.user._id });

    if(!restaurant){
        return res.status(404).json({ message: "Restaurant not found" });
    }

    const { name, description, price } = req.body;
    if(!name || !price){
        return res.status(400).json({ message: "Name and price are required" });
    }

    const file = req.file;
    if(!file){
        return res.status(400).json({ message: "Restaurant image is required" });
    }

    const filebuffer = getBuffer(file);
    if(!filebuffer?.content){
        return res.status(500).json({ message: "failed to create file buffer" });
    }

    const { data: uploadResult } = await axios.post(`${process.env.UTILS_URL}/api/upload`, { file: filebuffer.content });

    const manuItem = await Manu.create({
        name,
        description,
        price,
        image: uploadResult.url,
        restaurantId: restaurant._id
    })

    res.status(201).json({
        message: "Menu item added successfully",
        manuItem
    });
}

export const getAllItems = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.user){
        return res.status(401).json({ message: "Please login to view menu items" });
    }
    const { id } = req.params;
    if(!id){
        return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const manuItems = await Manu.find({ restaurantId: id });

    res.status(200).json({
        manuItems
    });
}

export const deleteManuItem = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.user){
        return res.status(401).json({ message: "Please login to delete menu item" });
    }
    const { ItemId } = req.params;
    if(!ItemId){
        return res.status(400).json({ message: "Menu item ID is required" });
    }

    const item = await Manu.findById(ItemId);
    if(!item){
        return res.status(404).json({ message: "Menu item not found" });
    }

    const restaurant = await Restaurant.findOne({ _id: item.restaurantId, ownerId: req.user._id });
    if(!restaurant){
        return res.status(403).json({ message: "You are not authorized to delete this menu item" });
    }

    await item.deleteOne();
    res.status(200).json({ message: "Menu item deleted successfully" });
}

export const toggleManuItemAvailability = async (req: AuthenticatedRequest, res: Response) => {
    if(!req.user){
        return res.status(401).json({ message: "Please login to update menu item" });
    }
    const { ItemId } = req.params;
    if(!ItemId){
        return res.status(400).json({ message: "Menu item ID is required" });
    }

    const item = await Manu.findById(ItemId);
    if(!item){
        return res.status(404).json({ message: "Menu item not found" });
    }

    const restaurant = await Restaurant.findOne({ _id: item.restaurantId, ownerId: req.user._id });
    if(!restaurant){
        return res.status(403).json({ message: "You are not authorized to update this menu item" });
    }

    item.isAvailable = !item.isAvailable;
    await item.save();

    res.status(200).json({
        message: `Menu Item Marked as ${item.isAvailable ? "available" : "unavailable"}`,
        item
    });
}

