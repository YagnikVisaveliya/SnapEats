import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Address } from "../model/address.model.js";

export const addAddress = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { mobile, formattedAddress, latitude, longitude } = req.body;
  if (
    !mobile ||
    !formattedAddress ||
    latitude === undefined ||
    longitude === undefined
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const newAddress = await Address.create({
    userId: user._id.toString(),
    mobile,
    formattedAddress,
    location: {
      type: "Point",
      coordinates: [Number(longitude), Number(latitude)],
    },
  });

  res.status(201).json({ message: "Address added successfully", address: newAddress });
};


export const deleteAddress = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addressId  = req.params.id;
    // console.log(addressId)
    if (!addressId) {
      return res.status(400).json({ message: "Address ID is required" });
    }
    const address = await Address.findOne({ _id: addressId, userId: user._id.toString() });
    if(!address) {
        return res.status(404).json({ message: "Address not found" });
    }
    await address.deleteOne();
    res.status(200).json({ message: "Address deleted successfully" });
}

export const getAddresses = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const addresses = await Address.find({ userId: user._id.toString() }).sort({ createdAt: -1 });
    res.status(200).json({ addresses });
}