import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Address } from "../model/address.model.js";
import { Cart } from "../model/cart.model.js";
import { IRestaurant, Restaurant } from "../model/restaurant.model.js";
import { IManu } from "../model/manu.model.js";
import { Order } from "../model/order.model.js";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { paymentMethod, addressId } = req.body;

  if (!addressId) {
    return res.status(400).json({ message: "address ID are required" });
  }

  const address = await Address.findOne({ _id: addressId, userId: user._id });
  if (!address) {
    return res.status(404).json({ message: "Address not found" });
  }

  const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return +(R * c).toFixed(2);
  };

  const cartItems = await Cart.find({ userId: user._id })
    .populate<{ itemId: IManu }>("itemId")
    .populate<{ restaurantId: IRestaurant }>("restaurantId");
  if (cartItems.length === 0) {
    return res.status(400).json({ message: "Cart is empty" });
  }

  const fisrtCartItem = cartItems[0];
  if (!fisrtCartItem || !fisrtCartItem.restaurantId) {
    return res.status(400).json({ message: "Invalid restaurant in cart" });
  }

  const restaurantId = fisrtCartItem.restaurantId._id;

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) {
    return res.status(404).json({ message: "Restaurant not found" });
  }

  if (!restaurant.isOpen) {
    return res.status(400).json({ message: "Restaurant is not Open" });
  }

  const distance = getDistanceKm(
    address.location.coordinates[1],
    address.location.coordinates[0],
    restaurant.autoLocation.coordinates[1],
    restaurant.autoLocation.coordinates[0],
  );

  let subTotal = 0;

  const orderItems = cartItems.map((cart) => {
    const item = cart.itemId;
    if (!item) {
      throw new Error("Item not found in cart");
    }

    const itemTotal = item.price * cart.quantity;

    subTotal += itemTotal;

    return {
      itemId: item._id.toString(),
      name: item.name,
      price: item.price,
      quantity: cart.quantity,
    };
  });

  const deliveryFee = subTotal > 150 ? 0 : distance < 2 ? 34 : distance * 17;
  const platformFee = subTotal * 0.05; // Example: 5% of total price
  const totalAmount = subTotal + deliveryFee + platformFee;

  const expireAt = new Date(Date.now() + 15 * 60 * 1000);
  const [longitude, latitude] = address.location.coordinates;

  const riderEarning = Math.ceil(distance) * 17;

  const order = await Order.create({
    userId: user._id.toString(),
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderEarning,
    items: orderItems,
    subTotal,
    deliveryCharge: deliveryFee,
    platformCharge: platformFee,
    totalAmount,
    addressId: address._id.toString(),
    deliveryAddress: {
      fromattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },

    paymentMethod,
    paymentStatus: "pending",
    status: "placed",
    expireAt,
  });

  await Cart.deleteMany({ userId: user._id });

  res.status(201).json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: totalAmount,
  });
};

export const fetchOrderForPayment = async (req: AuthenticatedRequest, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({
        message: "Forbidden",
        });
    }

    const order = await Order.findById(req.params.id);
    if(!order) {
        return res.status(404).json({
            message: "Order not found",
        });
    }

    if(order.paymentStatus !== "pending") {
        return res.status(400).json({
            message: "Order already paid",
        });
    }

    res.status(200).json({
        orderId: order._id.toString(),
        amount: order.totalAmount,
        currency: "INR",
    });
}