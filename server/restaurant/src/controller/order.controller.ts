import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middleware/isAuth.middleware.js";
import { Address } from "../model/address.model.js";
import { Cart } from "../model/cart.model.js";
import { IRestaurant, Restaurant } from "../model/restaurant.model.js";
import { IManu } from "../model/manu.model.js";
import { Order } from "../model/order.model.js";
import axios from "axios";
import { publishEvent } from "../config/order.pubplisher.js";
import { Coupon } from "../model/coupon.model.js";
import { sendOrderEmail } from "../utils/mail.js";

export const createOrder = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { paymentMethod, addressId, useWallet, couponCode } = req.body;

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

  let couponDiscount = 0;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
    if (
      coupon &&
      coupon.isActive &&
      new Date() <= new Date(coupon.expiryDate) &&
      (coupon.usageLimit === 0 || coupon.usedCount < coupon.usageLimit) &&
      subTotal >= coupon.minOrderValue
    ) {
      if (coupon.discountType === "PERCENTAGE") {
        couponDiscount = (subTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscount && couponDiscount > coupon.maxDiscount) {
          couponDiscount = coupon.maxDiscount;
        }
      } else {
        couponDiscount = coupon.discountValue;
      }
      couponDiscount = Math.min(couponDiscount, subTotal);
    } else {
      return res.status(400).json({ message: "Invalid or expired coupon code" });
    }
  }

  const deliveryFee = subTotal > 150 ? 0 : distance < 2 ? 24 : distance * 12;
  const platformFee = subTotal * 0.08; // 8% of total price
  const totalAmount = subTotal + deliveryFee + platformFee - couponDiscount;

  const expireAt = new Date(Date.now() + 15 * 60 * 1000);
  const [longitude, latitude] = address.location.coordinates;

  const riderEarning = Math.ceil(distance) * 12;
  const otp = Math.floor(100000 + Math.random() * 900000);

  let walletUsed = 0;
  if (useWallet) {
    try {
      const { data: walletDebit } = await axios.post(
        `${process.env.WALLET_SERVICE_URL}/api/wallet/internal/debit`,
        {
          userId: user._id.toString(),
          amount: totalAmount,
          description: "Wallet used during checkout",
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        },
      );

      walletUsed = Number(walletDebit?.debitedAmount ?? 0);
    } catch (walletError) {
      return res.status(500).json({ message: "Failed to apply wallet amount" });
    }
  }

  const payableAmount = Math.max(0, Number((totalAmount - walletUsed).toFixed(2)));
  const paymentStatus = payableAmount === 0 ? "paid" : "pending";

  const order = await Order.create({
    userId: user._id.toString(),
    userEmail: user.email,
    restaurantId: restaurantId.toString(),
    restaurantName: restaurant.name,
    riderId: null,
    distance,
    riderEarning: riderEarning,
    items: orderItems,
    subTotal,
    deliveryCharge: deliveryFee,
    platformCharge: platformFee,
    totalAmount,
    couponCode: couponDiscount > 0 ? couponCode.toUpperCase() : undefined,
    couponDiscount,
    walletUsed,
    payableAmount,
    addressId: address._id.toString(),
    deliveryAddress: {
      fromattedAddress: address.formattedAddress,
      mobile: address.mobile,
      latitude,
      longitude,
    },

    paymentMethod,
    paymentStatus,
    status: "placed",
    expireAt,
    otp,
  });

  await Cart.deleteMany({ userId: user._id });
  await sendOrderEmail(user.email, restaurant.name, otp).catch((err) => {
    console.error("Failed to send order confirmation email:", err);
  });

  if (couponDiscount > 0 && couponCode) {
    await Coupon.findOneAndUpdate(
      { code: couponCode.toUpperCase() },
      { $inc: { usedCount: 1 } }
    );
  }

  res.status(201).json({
    message: "Order created successfully",
    orderId: order._id.toString(),
    amount: payableAmount,
    totalAmount,
    walletUsed,
    paymentStatus,
  });
};

export const cancelOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const ALLOWED_CANCELLATION_STATUSES = ["placed", "accepted"];
    if (!ALLOWED_CANCELLATION_STATUSES.includes(order.status)) {
      return res.status(400).json({
        message: `Order cannot be cancelled at status: ${order.status}`,
      });
    }

    // Update order status
    order.status = "cancelled";
    order.paymentStatus = "refunded";
    await order.save();

    // Trigger Refund to Wallet
    try {
      await axios.post(
        `${process.env.WALLET_SERVICE_URL}/api/wallet/internal/refund`,
        {
          userId: order.userId,
          amount: order.totalAmount,
          orderId: order._id,
          description: `Refund for cancelled order #${order._id}`,
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
          },
        }
      );
    } catch (refundError) {
      console.error("Failed to trigger automated refund:", refundError);
      // We still cancelled the order, but refund might need manual intervention or retry
    }

    // Notify Restaurant
    try {
      await axios.post(
        `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
        {
          event: "order:cancelled",
          room: `restaurant:${order.restaurantId}`,
          payload: {
            orderId: order._id.toString(),
            message: "An order has been cancelled by the user",
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
          },
        }
      );
    } catch (notifyError) {
      console.error("Failed to notify restaurant about cancellation:", notifyError);
    }

    // Notify User via Socket
    try {
      await axios.post(
        `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
        {
          event: "order:status_updated",
          room: `user:${order.userId}`,
          payload: {
            orderId: order._id.toString(),
            status: "cancelled",
          },
        },
        {
          headers: {
            "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
          },
        }
      );
    } catch (notifyUserError) {
       console.error("Failed to notify user about cancellation:", notifyUserError);
    }

    res.json({ message: "Order cancelled successfully and refund initiated to wallet", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchOrderForPayment = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.paymentStatus !== "pending") {
    return res.status(400).json({
      message: "Order already paid",
    });
  }

  res.status(200).json({
    orderId: order._id.toString(),
    amount: order.payableAmount ?? Math.max(0, Number((order.totalAmount - (order.walletUsed ?? 0)).toFixed(2))),
    currency: "INR",
  });
};

export const fetchRestaurantOrders = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { restaurantId } = req.params;

    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const { limit } = req.query;

    const orders = await Order.find({
      restaurantId,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit as string) : 20);

    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching restaurant orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const ALLOWED_STATUSES = ["accepted", "preparing", "ready_for_rider"] as const;

export const updateOrderStatus = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { orderId } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({
          message: `Invalid status. Allowed statuses are: ${ALLOWED_STATUSES.join(", ")}`,
        });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentStatus !== "paid") {
      return res
        .status(400)
        .json({ message: "Cannot update status of unpaid order" });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    if (restaurant.ownerId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not the owner of the restaurant" });
    }

    order.status = status;
    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:status_updated",
        room: `user:${order.userId}`,
        payload: {
          orderId: order._id.toString(),
          status: order.status,
        },
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );
    //now assign rider if order is ready for pickup
    if (status === "ready_for_rider") {
      console.log("Publishing Order Ready for rider", order._id);
      await publishEvent("ORDER_READY_FOR_RIDER", {
        orderId: order._id.toString(),
        restaurantId: restaurant._id.toString(),
        location: restaurant.autoLocation,
      });
      console.log("Event Published Successfully");
    }

    res.json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getMyOrders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const orders = await Order.find({
      userId: user._id.toString(),
      paymentStatus: "paid",
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSingleOrder = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.userId.toString() !== user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to view this order" });
    }

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error fetching single order:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const assignRiderToOrder = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId, riderId, riderName, riderPhone } = req.body;

  const orderAvailable = await Order.findOne({ riderId, status: { $ne: "delivered" } });
  if (orderAvailable) {
    return res.status(409).json({
      message: "Rider is currently assigned to another order",
    });
  }

  const order = await Order.findById(orderId);
  if (order?.riderId !== null) {
    return res.status(404).json({
      message: "Order Already Assign",
    });
  }

  const updatedOrder = await Order.findOneAndUpdate(
    {
      _id: orderId,
      riderId: null,
    },
    {
      riderId,
      riderName,
      riderPhone,
      status: "rider_assigned",
    },
    {
      new: true,
    },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `user:${order.userId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
      },
    },
  );
  await axios.post(
    `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
    {
      event: "order:rider_assigned",
      room: `restaurant:${order.restaurantId}`,
      payload: order,
    },
    {
      headers: {
        "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
      },
    },
  );

  res.json({
    message: "Rider assigned successfully",
    success: true,
    order: updatedOrder,
  });
};

export const getCurrentOrdersForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { riderId } = req.query;
  if (!riderId) {
    return res.status(400).json({
      message: "Rider id is required",
    });
  }

  const order = await Order.findOne({
    riderId,
    status: { $ne: "delivered" },
  }).select("-otp").populate("restaurantId");

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  res.json(order);
};

export const getOrderPreviewForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const { orderId } = req.params;
  if (!orderId) {
    return res.status(400).json({
      message: "Order id is required",
    });
  }

  const order = await Order.findById(orderId).select(
    "restaurantName totalAmount riderEarning distance deliveryAddress status riderId",
  );

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.riderId) {
    return res.status(409).json({
      message: "Order already assigned",
    });
  }

  if (order.status !== "ready_for_rider") {
    return res.status(409).json({
      message: "Order is no longer available for riders",
    });
  }

  return res.json({
    order: {
      _id: order._id,
      restaurantName: order.restaurantName,
      totalAmount: order.totalAmount,
      riderEarning: order.riderEarning,
      distance: order.distance,
      deliveryAddress: order.deliveryAddress,
    },
  });
};

export const getDeliveredOrdersForRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const riderId = (req.query?.riderId as string | undefined)?.trim();
  const range = (req.query?.range as string | undefined)?.trim() || "week";

  if (!riderId) {
    return res.status(400).json({
      message: "Rider id is required",
    });
  }

  const now = new Date();
  let startDate: Date | null = null;

  if (range === "day") {
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (range === "week") {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "month") {
    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (range !== "all") {
    return res.status(400).json({
      message: "Invalid range. Use day, week, month, or all",
    });
  }

  const query: any = {
    riderId,
    status: "delivered",
    paymentStatus: "paid",
  };

  if (startDate) {
    query.updatedAt = { $gte: startDate };
  }

  const orders = await Order.find(query)
    .sort({ updatedAt: -1 })
    .select(
      "_id restaurantName totalAmount riderEarning distance deliveryAddress status updatedAt createdAt",
    );

  const totalEarning = orders.reduce((sum, order) => sum + (order.riderEarning || 0), 0);
  const totalDistance = orders.reduce((sum, order) => sum + (order.distance || 0), 0);

  return res.json({
    filter: range,
    summary: {
      totalDelivered: orders.length,
      totalEarning,
      totalDistance: Number(totalDistance.toFixed(2)),
      averageEarning: orders.length ? Number((totalEarning / orders.length).toFixed(2)) : 0,
    },
    orders,
  });
};
export const updateOrderStatusByRider = async (req: Request, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  const orderId =
    (req.body?.orderId as string | undefined) ||
    (req.query?.orderId as string | undefined);

  if (!orderId) {
    return res.status(400).json({
      message: "Order id is required",
    });
  }

  const order = await Order.findById(orderId);

  if (!order) {
    return res.status(404).json({
      message: "Order not found",
    });
  }

  if (order.status === "rider_assigned") {
    order.status = "picked_up";

    await order.save();

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    return res.json({
      message: "Order status updated to picked up",
    });
  }

  if (order.status === "picked_up"){
    const reqOtp = Number(req.body?.otp) || Number(req.query?.otp);

    if (!reqOtp || reqOtp !== order.otp) {
      return res.status(400).json({
        message: "Invalid or missing OTP",
      });
    }

    order.status = "delivered";
    await order.save();

    // Reward triggers: first order cashback + every 5th delivered order loyalty bonus
    try {
      const deliveredCount = await Order.countDocuments({
        userId: order.userId,
        status: "delivered",
      });

      if (deliveredCount === 1) {
        // Trigger First Order Cashback
        await axios.post(
          `${process.env.WALLET_SERVICE_URL}/api/wallet/internal/first-order-cashback`,
          {
            userId: order.userId,
            userEmail: order.userEmail,
            orderId: order._id,
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );

        // Trigger Referral Reward
        await axios.post(
          `${process.env.WALLET_SERVICE_URL}/api/wallet/internal/referral-reward`,
          {
            refereeId: order.userId,
            refereeEmail: order.userEmail,
            orderId: order._id,
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        ).catch(err => console.error("Failed to trigger referral reward:", err?.response?.data || err.message));
      }

      if (deliveredCount > 0 && deliveredCount % 5 === 0) {
        await axios.post(
          `${process.env.WALLET_SERVICE_URL}/api/wallet/internal/loyalty-bonus`,
          {
            userId: order.userId,
            userEmail: order.userEmail,
            orderCount: deliveredCount,
          },
          {
            headers: {
              "x-internal-key": process.env.INTERNAL_SERVICE_KEY,
            },
          }
        );
      }
    } catch (loyaltyError) {
      console.error("Failed to trigger order rewards:", loyaltyError);
    }

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `restaurant:${order.restaurantId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    await axios.post(
      `${process.env.REALTIME_SERVICE_URL}/api/v1/internal/emit`,
      {
        event: "order:rider_assigned",
        room: `user:${order.userId}`,
        payload: order,
      },
      {
        headers: {
          "x-internal-key": process.env.INTERNAL_SERVICE_KEY || "",
        },
      },
    );

    return res.json({
      message: "Order status updated to delivered",
    });
  }

  return res.status(400).json({
    message: `Cannot update order from status ${order.status}`,
  });
};

export const getRestaurantSalesAnalytics = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { restaurantId } = req.params;
    if (!restaurantId) {
      return res.status(400).json({ message: "Restaurant ID is required" });
    }

    const range = (req.query?.range as string | undefined)?.trim() || "week";

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== user._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const now = new Date();
    let startDate: Date | null = null;

    if (range === "day") {
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    } else if (range === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (range === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (range !== "all") {
      return res.status(400).json({
        message: "Invalid range. Use day, week, month, or all",
      });
    }

    const query: any = {
      restaurantId,
      status: "delivered",
      paymentStatus: "paid",
    };

    if (startDate) {
      query.updatedAt = { $gte: startDate };
    }

    const orders = await Order.find(query).select("totalAmount subTotal deliveryCharge items updatedAt");

    const PLATFORM_CUT_PERCENT = 13; // Example: Platform takes 13% commission on each order
    const restaurantShareRatio = (100 - PLATFORM_CUT_PERCENT) / 100;

    const totalRevenue = orders.reduce((sum, order) => {
      const grossOrderValue = Number(order.subTotal ?? 0);
      return sum + grossOrderValue * restaurantShareRatio;
    }, 0);
    
    const timeSeriesMap: Record<string, number> = {};
    const itemMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

    orders.forEach((order) => {
      // TimeSeries grouping
      const dateStr = order.updatedAt.toISOString().split("T")[0] as string; // YYYY-MM-DD
      const grossOrderValue = Number(order.subTotal ?? 0);
      const netOrderRevenue = grossOrderValue * restaurantShareRatio;
      timeSeriesMap[dateStr] = (timeSeriesMap[dateStr] || 0) + netOrderRevenue;

      // Itemwise totals
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (!itemMap[item.itemId]) {
            itemMap[item.itemId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          itemMap[item.itemId]!.quantity += item.quantity || 0;
          itemMap[item.itemId]!.revenue += (item.price || 0) * (item.quantity || 0);
        });
      }
    });

    // Format timeseries for chart
    const timeSeriesData = Object.entries(timeSeriesMap)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Format itemwise data
    const itemWiseData = Object.values(itemMap)
      .sort((a, b) => b.revenue - a.revenue); // Sort by highest revenue

    return res.json({
      success: true,
      filter: range,
      summary: {
        totalOrders: orders.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
      },
      timeSeriesData,
      itemWiseData,
    });
  } catch (error) {
    console.error("Error fetching restaurant sales analytics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const allOrders = async (req: AuthenticatedRequest, res: Response) => {
  if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.error("Error fetching all orders:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const internalUserOrderCount = async (req: Request, res: Response) => {
    if (req.headers["x-internal-key"] !== process.env.INTERNAL_SERVICE_KEY) {
        return res.status(403).json({ message: "Forbidden" });
    }
    try {
        const { userId } = req.params;
        if (!userId) return res.status(400).json({ message: "userId is required" });

        const count = await Order.countDocuments({ 
            userId: String(userId),
            paymentStatus: "paid"
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};